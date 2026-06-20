from flask import Blueprint, request, Response, g, current_app
import json
from database import FootprintEntry, User
from services.auth_service import token_required
from services.rate_limiter import rate_limit
from services.claude import stream_claude_response

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/chat', methods=['POST'])
@token_required
@rate_limit(limit=15, period=60)
def chat_with_advisor():
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    history = data.get('history', []) # list of {"role": "user"|"assistant", "content": "..."}
    
    if not message:
        return Response(json.dumps({"error": "Message is required"}), status=400, mimetype='application/json')
        
    user = g.current_user
    
    # Query user entries to give Claude data context
    entries = FootprintEntry.query.filter_by(user_id=user.id).all()
    
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
            
    total_lifetime = sum(category_totals.values())
    
    # Format a summary of the user's carbon footprint data
    data_summary = f"""
    User: {user.username}
    Total Green Points: {user.points}
    Lifetime Emissions Breakdown (kg CO2):
    - Transportation: {category_totals['transportation']:.1f}
    - Household Energy: {category_totals['energy']:.1f}
    - Waste & Trash: {category_totals['waste']:.1f}
    - Diet & Nutrition: {category_totals['diet']:.1f}
    - Total: {total_lifetime:.1f}
    """
    
    system_instruction = (
        "You are GreenTrack AI, an advanced conversational carbon footprint coach and advisor. "
        "Your mission is to help the user understand, track, and reduce their carbon footprint through highly personalized, actionable advice. "
        "Use the user's actual emissions data context to give precise, data-driven feedback. If they have zero emissions, encourage them to log their first entry. "
        "Be friendly, professional, concise, and scientifically accurate. Avoid generic advice; refer directly to their highest carbon sources and suggest practical changes."
        f"\n\nUser Data Context:\n{data_summary}"
    )
    
    # Get streamed generator
    stream_generator = stream_claude_response(message, system_instruction, history)
    
    return Response(stream_generator, mimetype='text/event-stream')
