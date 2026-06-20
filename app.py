import os
from threading import Lock
from flask import Flask, send_from_directory, jsonify, request
from flask_migrate import Migrate
from database import db, Challenge
from config import DevelopmentConfig, ProductionConfig
from routes.auth import auth_bp
from routes.tracker import tracker_bp
from routes.challenges import challenges_bp
from routes.recommendations import recommendations_bp
from routes.offsets import offsets_bp
from routes.ai import ai_bp
from commands import db_backup_command

db_lock = Lock()


def create_app(config_class=None):
    app = Flask(__name__, static_folder='static', static_url_path='')
    
    # Load configuration
    if config_class is None:
        if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('VERCEL') == '1':
            config_class = ProductionConfig
        else:
            config_class = DevelopmentConfig

            
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tracker_bp, url_prefix='/api/tracker')
    app.register_blueprint(challenges_bp, url_prefix='/api/challenges')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(offsets_bp, url_prefix='/api/offsets')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    
    # Register CLI commands
    app.cli.add_command(db_backup_command)
    
    @app.route('/api/health')
    def api_health():
        from database import User, OffsetTransaction, FootprintEntry
        from sqlalchemy import func
        try:
            total_offset = db.session.query(func.sum(OffsetTransaction.co2_offset)).scalar() or 0.0
            total_points_spent = db.session.query(func.sum(OffsetTransaction.points_spent)).scalar() or 0
            current_users_points = db.session.query(func.sum(User.points)).scalar() or 0
            total_points_earned = current_users_points + total_points_spent
            active_users = User.query.count()
            total_entries = FootprintEntry.query.count()

            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'metrics': {
                    'total_co2_offset_kg': float(total_offset),
                    'total_points_earned': int(total_points_earned),
                    'active_users': int(active_users),
                    'total_footprints_logged': int(total_entries)
                }
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e)
            }), 500

    # Root route to serve Frontend Single Page App
    @app.route('/')
    def serve_index():
        return app.send_static_file('index.html')
        
    @app.route('/<path:path>')
    def serve_static(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return app.send_static_file('index.html')

    # Seed initial challenges in the database lazily upon the first /api/ request
    # This prevents the app from crashing on import during Vercel cold starts or build processes.
    _db_initialized = False

    @app.before_request
    def maybe_initialize_database():
        nonlocal _db_initialized
        if not _db_initialized and request.path.startswith('/api/'):
            with db_lock:
                if not _db_initialized:
                    db.create_all()
                    if Challenge.query.first() is None:
                        challenges = [
                            Challenge(
                                title="Switch to LED Bulbs",
                                description="Replace at least 3 old incandescent lightbulbs in your house with energy-efficient LED bulbs.",
                                points_reward=50,
                                category="energy",
                                rules_regex="(installed|replaced|led|bulbs|light|fixture)"
                            ),
                            Challenge(
                                title="Go Car-Free for a Day",
                                description="Commit to walking, cycling, or using public transportation for all travel today instead of driving.",
                                points_reward=100,
                                category="transportation",
                                rules_regex="(walked|biked|cycled|bus|train|transit|metro|walk|bike|cycle)"
                            ),
                            Challenge(
                                title="Start Composting Organic Waste",
                                description="Begin composting food scraps and organic kitchen waste to divert it from landfills.",
                                points_reward=75,
                                category="waste",
                                rules_regex="(compost|organic|peels|bin|rotting|decay|scraps)"
                            ),
                            Challenge(
                                title="Eat a Completely Plant-Based Diet",
                                description="Prepare and eat three fully vegetarian/vegan meals today without meat or dairy products.",
                                points_reward=80,
                                category="diet",
                                rules_regex="(vegan|vegetarian|tofu|beans|salad|no meat|plant-based|veg)"
                            )
                        ]
                        db.session.bulk_save_objects(challenges)
                        db.session.commit()
                    _db_initialized = True
            
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
