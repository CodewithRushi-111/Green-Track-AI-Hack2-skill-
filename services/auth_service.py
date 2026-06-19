from functools import wraps
from flask import request, jsonify, current_app, g
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from database import User

def generate_token(user_id):
    """
    Generate a signed token using itsdangerous.
    """
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(user_id, salt='auth-token')

def verify_token(token):
    """
    Verify a signed token. Returns the user_id if valid, or None if expired/tampered.
    """
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    # Get expiration duration from config (default to 2 hours)
    max_age = current_app.config.get('TOKEN_EXPIRY_SECONDS', 7200)
    try:
        user_id = serializer.loads(token, salt='auth-token', max_age=max_age)
        return user_id
    except (SignatureExpired, BadSignature):
        return None

def token_required(f):
    """
    Decorator to protect routes requiring authentication.
    Requires Bearer token in the Authorization header.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Authentication token is missing. Please provide a Bearer token.'
            }), 401
        
        user_id = verify_token(token)
        if not user_id:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Authentication token is invalid or expired.'
            }), 401
        
        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({
                'error': 'Unauthorized',
                'message': 'User associated with this token no longer exists.'
            }), 401
        
        g.current_user = current_user
        return f(*args, **kwargs)
    return decorated
