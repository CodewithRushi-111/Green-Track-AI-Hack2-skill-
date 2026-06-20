import re
from flask import Blueprint, request, jsonify, g
from database import db, User
from services.auth_service import generate_token, token_required
from services.rate_limiter import rate_limit

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

@auth_bp.route('/register', methods=['POST'])
@rate_limit(limit=10, period=60)  # Lower rate limit for auth endpoints to prevent brute-force
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    # Validations
    if not username or not email or not password:
        return jsonify({'error': 'Bad Request', 'message': 'Username, email, and password are required.'}), 400

    if len(username) < 3:
        return jsonify({'error': 'Validation Error', 'message': 'Username must be at least 3 characters long.'}), 400

    if not re.match(EMAIL_REGEX, email):
        return jsonify({'error': 'Validation Error', 'message': 'Invalid email format.'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Validation Error', 'message': 'Password must be at least 6 characters long.'}), 400

    # Check uniqueness
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Conflict', 'message': 'Username is already taken.'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Conflict', 'message': 'Email is already registered.'}), 409

    try:
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        token = generate_token(new_user.id)
        return jsonify({
            'message': 'Registration successful.',
            'token': token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
@rate_limit(limit=10, period=60)
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Bad Request', 'message': 'Email and password are required.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid email or password.'}), 401

    token = generate_token(user.id)
    return jsonify({
        'message': 'Login successful.',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
@rate_limit(limit=30, period=60)
def profile():
    return jsonify({
        'user': g.current_user.to_dict()
    }), 200

@auth_bp.route('/demo', methods=['POST'])
@rate_limit(limit=30, period=60)
def demo_login():
    from database import FootprintEntry, OffsetTransaction, UserChallenge, Challenge
    import datetime
    
    demo_email = 'demo_judge@greentrack.ai'
    demo_username = 'Demo Judge'
    
    # 1. Check or create demo user
    user = User.query.filter_by(email=demo_email).first()
    if user:
        # Clear existing entries to prevent duplicate stacking
        FootprintEntry.query.filter_by(user_id=user.id).delete()
        OffsetTransaction.query.filter_by(user_id=user.id).delete()
        UserChallenge.query.filter_by(user_id=user.id).delete()
        user.points = 150
    else:
        user = User(username=demo_username, email=demo_email, points=150)
        user.set_password('demo_judge_pass_9988')
        db.session.add(user)
        db.session.flush() # get user id
        
    # 2. Seed realistic footprint data showing downward progress (5 months)
    now = datetime.datetime.utcnow()
    entries = []
    
    # 5 months ago
    entries.append(FootprintEntry(
        user_id=user.id,
        transportation=520.0,
        energy=160.0,
        waste=35.0,
        diet=320.0,
        total_emission=1035.0,
        recorded_at=now - datetime.timedelta(days=120)
    ))
    # 4 months ago
    entries.append(FootprintEntry(
        user_id=user.id,
        transportation=480.0,
        energy=150.0,
        waste=30.0,
        diet=310.0,
        total_emission=970.0,
        recorded_at=now - datetime.timedelta(days=90)
    ))
    # 3 months ago
    entries.append(FootprintEntry(
        user_id=user.id,
        transportation=420.0,
        energy=135.0,
        waste=28.0,
        diet=290.0,
        total_emission=873.0,
        recorded_at=now - datetime.timedelta(days=60)
    ))
    # 2 months ago
    entries.append(FootprintEntry(
        user_id=user.id,
        transportation=360.0,
        energy=120.0,
        waste=25.0,
        diet=260.0,
        total_emission=765.0,
        recorded_at=now - datetime.timedelta(days=30)
    ))
    # This month (current)
    entries.append(FootprintEntry(
        user_id=user.id,
        transportation=280.0,
        energy=95.0,
        waste=18.0,
        diet=210.0,
        total_emission=603.0,
        recorded_at=now - datetime.timedelta(days=1)
    ))
    
    for entry in entries:
        db.session.add(entry)
        
    # 3. Seed a completed challenge (Meatless Week)
    challenge = Challenge.query.first()
    if challenge:
        uc = UserChallenge(
            user_id=user.id,
            challenge_id=challenge.id,
            status='completed',
            proof_text='Adopted a plant-based diet for 7 days, reducing my footprint.',
            completed_at=now - datetime.timedelta(days=15)
        )
        db.session.add(uc)
        
    # 4. Seed an offset transaction (reforestation)
    offset_txn = OffsetTransaction(
        user_id=user.id,
        project_name='Reforestation in Madagascar',
        points_spent=50,
        co2_offset=20.0,
        created_at=now - datetime.timedelta(days=10)
    )
    db.session.add(offset_txn)
    
    try:
        db.session.commit()
        token = generate_token(user.id)
        return jsonify({
            'message': 'Demo mode initialized.',
            'token': token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

