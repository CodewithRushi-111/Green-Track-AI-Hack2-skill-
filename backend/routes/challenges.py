import re
import datetime
from flask import Blueprint, request, jsonify, g
from database import db, Challenge, UserChallenge, User
from services.auth_service import token_required
from services.rate_limiter import rate_limit

challenges_bp = Blueprint('challenges', __name__)

@challenges_bp.route('', methods=['GET'])
@token_required
@rate_limit(limit=30, period=60)
def get_challenges():
    user = g.current_user
    
    # Fetch all challenges
    all_challenges = Challenge.query.all()
    
    # Fetch user's accepted/completed challenges
    user_challenges = UserChallenge.query.filter_by(user_id=user.id).all()
    user_challenge_map = {uc.challenge_id: uc for uc in user_challenges}
    
    available = []
    active = []
    completed = []
    
    for c in all_challenges:
        uc = user_challenge_map.get(c.id)
        c_dict = c.to_dict()
        if not uc:
            available.append(c_dict)
        elif uc.status == 'active':
            c_dict['user_challenge_id'] = uc.id
            c_dict['accepted_at'] = uc.submitted_at.isoformat() if uc.submitted_at else None
            active.append(c_dict)
        elif uc.status == 'completed':
            c_dict['user_challenge_id'] = uc.id
            c_dict['proof_text'] = uc.proof_text
            c_dict['completed_at'] = uc.completed_at.isoformat() if uc.completed_at else None
            completed.append(c_dict)
            
    return jsonify({
        'available': available,
        'active': active,
        'completed': completed
    }), 200

@challenges_bp.route('/accept/<int:challenge_id>', methods=['POST'])
@token_required
@rate_limit(limit=30, period=60)
def accept_challenge(challenge_id):
    user = g.current_user
    
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        return jsonify({'error': 'Not Found', 'message': 'Challenge not found.'}), 404
        
    # Check if already accepted
    existing = UserChallenge.query.filter_by(user_id=user.id, challenge_id=challenge_id).first()
    if existing:
        return jsonify({
            'error': 'Conflict',
            'message': f'Challenge already accepted. Status: {existing.status}'
        }), 409
        
    try:
        new_uc = UserChallenge(
            user_id=user.id,
            challenge_id=challenge_id,
            status='active',
            submitted_at=datetime.datetime.utcnow()
        )
        db.session.add(new_uc)
        db.session.commit()
        return jsonify({
            'message': 'Challenge accepted successfully.',
            'challenge': new_uc.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

@challenges_bp.route('/submit/<int:challenge_id>', methods=['POST'])
@token_required
@rate_limit(limit=30, period=60)
def submit_proof(challenge_id):
    user = g.current_user
    data = request.get_json() or {}
    proof_text = data.get('proof_text', '').strip()
    
    if not proof_text:
        return jsonify({'error': 'Bad Request', 'message': 'Proof text is required.'}), 400
        
    uc = UserChallenge.query.filter_by(user_id=user.id, challenge_id=challenge_id, status='active').first()
    if not uc:
        return jsonify({
            'error': 'Not Found',
            'message': 'No active challenge found with this ID for the user.'
        }), 404
        
    # Audit logic: Check rules_regex on proof_text
    challenge = uc.challenge
    regex_pattern = challenge.rules_regex
    
    try:
        pattern = re.compile(regex_pattern, re.IGNORECASE)
    except Exception as e:
        return jsonify({'error': 'Server Error', 'message': f'Invalid regex configuration: {str(e)}'}), 500
        
    if not pattern.search(proof_text):
        return jsonify({
            'error': 'Audit Failed',
            'message': 'Your proof text did not satisfy the challenge validation rules. Please include details verifying your completion.'
        }), 400
        
    # Validation passes! Update status, completed date, and reward points
    try:
        uc.status = 'completed'
        uc.proof_text = proof_text
        uc.completed_at = datetime.datetime.utcnow()
        
        user.points += challenge.points_reward
        db.session.commit()
        
        return jsonify({
            'message': 'Challenge successfully verified and audited! Points awarded.',
            'points_awarded': challenge.points_reward,
            'total_points': user.points,
            'challenge': uc.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500
