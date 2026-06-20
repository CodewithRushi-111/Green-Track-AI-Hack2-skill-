import datetime
from flask import Blueprint, request, jsonify, g
from database import db, OffsetTransaction, User
from services.auth_service import token_required
from services.rate_limiter import rate_limit

offsets_bp = Blueprint('offsets', __name__)

# Predefined nature friendly projects
OFFSET_PROJECTS = [
    {
        'id': 'reforestation',
        'title': 'Reforestation in Madagascar',
        'description': 'Plant native mangrove trees to restore local coastal ecosystems and capture CO2.',
        'points_cost': 50,
        'co2_offset': 20.0, # kg CO2
        'icon': '🌳'
    },
    {
        'id': 'solar_community',
        'title': 'Community Solar Array',
        'description': 'Support clean solar panels in rural villages to replace dirty diesel generator dependency.',
        'points_cost': 100,
        'co2_offset': 50.0, # kg CO2
        'icon': '☀️'
    },
    {
        'id': 'ocean_cleanup',
        'title': 'Ocean Bubble Barrier',
        'description': 'Deploy bubble screen barriers in rivers to filter and extract plastic waste before reaching oceans.',
        'points_cost': 150,
        'co2_offset': 80.0, # kg CO2
        'icon': '🌊'
    },
    {
        'id': 'cookstoves',
        'title': 'Clean Cookstoves Initiative',
        'description': 'Provide efficient biomass cookstoves to families, reducing smoke inhalation and local wood harvesting.',
        'points_cost': 80,
        'co2_offset': 40.0, # kg CO2
        'icon': '🔥'
    }
]

@offsets_bp.route('', methods=['GET'])
@token_required
@rate_limit(limit=30, period=60)
def get_offsets():
    transactions = OffsetTransaction.query.filter_by(user_id=g.current_user.id).order_by(OffsetTransaction.created_at.desc()).all()
    total_offset = sum(t.co2_offset for t in transactions)
    
    return jsonify({
        'projects': OFFSET_PROJECTS,
        'transactions': [t.to_dict() for t in transactions],
        'total_offset': round(total_offset, 2)
    }), 200

@offsets_bp.route('/purchase', methods=['POST'])
@token_required
@rate_limit(limit=10, period=60)
def purchase_offset():
    data = request.get_json() or {}
    project_id = data.get('project_id')
    
    project = next((p for p in OFFSET_PROJECTS if p['id'] == project_id), None)
    if not project:
        return jsonify({'error': 'Bad Request', 'message': 'Invalid project selected.'}), 400
        
    user = User.query.get(g.current_user.id)
    if user.points < project['points_cost']:
        return jsonify({
            'error': 'Forbidden', 
            'message': f"Insufficient Green Points. You need {project['points_cost']} pts but only have {user.points} pts."
        }), 403
        
    try:
        # Deduct points
        user.points -= project['points_cost']
        
        # Create transaction record
        new_transaction = OffsetTransaction(
            user_id=user.id,
            project_name=project['title'],
            co2_offset=project['co2_offset'],
            points_spent=project['points_cost'],
            created_at=datetime.datetime.utcnow()
        )
        
        db.session.add(new_transaction)
        db.session.commit()
        
        return jsonify({
            'message': f"Success! You successfully funded: {project['title']}.",
            'transaction': new_transaction.to_dict(),
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500
