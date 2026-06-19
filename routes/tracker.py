import datetime
from flask import Blueprint, request, jsonify, g
from database import db, FootprintEntry, OffsetTransaction
from services.auth_service import token_required
from services.rate_limiter import rate_limit

tracker_bp = Blueprint('tracker', __name__)

@tracker_bp.route('/entry', methods=['POST'])
@token_required
@rate_limit(limit=30, period=60)
def create_entry():
    data = request.get_json() or {}
    
    # Extract values, default to 0.0 if not specified
    try:
        transportation = float(data.get('transportation', 0.0))
        energy = float(data.get('energy', 0.0))
        waste = float(data.get('waste', 0.0))
        diet = float(data.get('diet', 0.0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Bad Request', 'message': 'All input values must be numeric.'}), 400

    # Validation: emission values cannot be negative or ridiculously high
    if transportation < 0 or energy < 0 or waste < 0 or diet < 0:
        return jsonify({'error': 'Validation Error', 'message': 'Footprint values cannot be negative.'}), 400

    if transportation > 100000 or energy > 100000 or waste > 100000 or diet > 100000:
        return jsonify({'error': 'Validation Error', 'message': 'Footprint values exceed maximum limits.'}), 400

    total_emission = transportation + energy + waste + diet

    try:
        new_entry = FootprintEntry(
            user_id=g.current_user.id,
            transportation=transportation,
            energy=energy,
            waste=waste,
            diet=diet,
            total_emission=total_emission,
            recorded_at=datetime.datetime.utcnow()
        )
        db.session.add(new_entry)
        db.session.commit()
        return jsonify({
            'message': 'Footprint entry saved successfully.',
            'entry': new_entry.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

@tracker_bp.route('/history', methods=['GET'])
@token_required
@rate_limit(limit=30, period=60)
def get_history():
    period = request.args.get('period', 'all').lower()
    now = datetime.datetime.utcnow()
    
    query = FootprintEntry.query.filter_by(user_id=g.current_user.id)
    
    if period == '3m':
        start_date = now - datetime.timedelta(days=90)
        query = query.filter(FootprintEntry.recorded_at >= start_date)
    elif period == '6m':
        start_date = now - datetime.timedelta(days=180)
        query = query.filter(FootprintEntry.recorded_at >= start_date)
    elif period == 'ytd':
        start_date = datetime.datetime(now.year, 1, 1)
        query = query.filter(FootprintEntry.recorded_at >= start_date)
        
    # Sort entries by recorded_at ascending
    entries = query.order_by(FootprintEntry.recorded_at.asc()).all()
    return jsonify([entry.to_dict() for entry in entries]), 200

@tracker_bp.route('/compare', methods=['GET'])
@token_required
@rate_limit(limit=30, period=60)
def get_comparison():
    # Targets (in kg CO2 per month or equivalent units)
    # Average individual monthly footprint:
    # National Target (e.g., USA/UK average targets) vs Global Climate Target (IPCC recommended individual targets)
    global_target = 350.0  # kg CO2/month
    national_target = 600.0  # kg CO2/month
    
    # Calculate user's monthly average
    entries = FootprintEntry.query.filter_by(user_id=g.current_user.id).all()
    if not entries:
        user_average = 0.0
    else:
        user_average = sum(e.total_emission for e in entries) / len(entries)
        
    # Fetch offset totals
    offsets = OffsetTransaction.query.filter_by(user_id=g.current_user.id).all()
    total_offset = sum(o.co2_offset for o in offsets)
    
    # Calculate user's net average (deducting average offset)
    net_average = max(0.0, user_average - (total_offset / max(1, len(entries))))
        
    return jsonify({
        'user_average': round(user_average, 2),
        'total_offset': round(total_offset, 2),
        'net_average': round(net_average, 2),
        'national_target': national_target,
        'global_target': global_target,
        'status': 'Under Target' if net_average <= global_target else ('Over Global Target' if net_average <= national_target else 'Critically High')
    }), 200

