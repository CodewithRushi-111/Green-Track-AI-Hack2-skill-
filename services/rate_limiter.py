import time
from functools import wraps
from flask import request, jsonify
from threading import Lock

# Thread-safe in-memory rate-limiter state
ip_requests = {}
rate_limit_lock = Lock()

def rate_limit(limit=60, period=60):
    """
    Decorator to limit API requests based on client IP address.
    Default: 60 requests per 60 seconds.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            from flask import current_app
            if current_app.config.get('TESTING') and not current_app.config.get('TEST_RATE_LIMITING'):
                return f(*args, **kwargs)

            # Fallback to localhost if remote_addr is not present
            ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1').split(',')[0].strip()
            now = time.time()
            
            with rate_limit_lock:
                if ip not in ip_requests:
                    ip_requests[ip] = []
                
                # Keep only timestamps within the current rate limit window
                ip_requests[ip] = [t for t in ip_requests[ip] if now - t < period]
                
                if len(ip_requests[ip]) >= limit:
                    return jsonify({
                        'error': 'Too Many Requests',
                        'message': f'Rate limit exceeded. Maximum of {limit} requests per {period} seconds allowed.'
                    }), 429
                
                ip_requests[ip].append(now)
            
            return f(*args, **kwargs)
        return wrapped
    return decorator
