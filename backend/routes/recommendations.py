from flask import Blueprint, jsonify, g
from database import FootprintEntry
from services.auth_service import token_required
from services.gemini import get_recommendations_for_user
from services.rate_limiter import rate_limit

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('', methods=['GET'])
@token_required
@rate_limit(limit=20, period=60)
def get_recommendations():
    user = g.current_user
    
    # Query user entries to find the highest category
    entries = FootprintEntry.query.filter_by(user_id=user.id).all()
    
    # Default averages and categories if no entries exist
    category_totals = {
        'transportation': 0.0,
        'energy': 0.0,
        'waste': 0.0,
        'diet': 0.0
    }
    
    if entries:
        for entry in entries:
            category_totals['transportation'] += entry.transportation
            category_totals['energy'] += entry.energy
            category_totals['waste'] += entry.waste
            category_totals['diet'] += entry.diet
            
        # Determine highest category
        highest_category = max(category_totals, key=category_totals.get)
    else:
        # Default to energy if no data is available yet
        highest_category = 'energy'
        
    result = get_recommendations_for_user(highest_category, category_totals)
    return jsonify(result), 200
