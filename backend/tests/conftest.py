import pytest
from app import create_app
from database import db, Challenge
from config import TestingConfig

@pytest.fixture
def app():
    # Instantiate app with TestingConfig profile
    app = create_app(TestingConfig)
    
    with app.app_context():
        db.create_all()
        # Seed default challenges for tests if they got wiped
        if Challenge.query.first() is None:
            challenges = [
                Challenge(
                    title="Switch to LED Bulbs",
                    description="Replace old bulbs.",
                    points_reward=50,
                    category="energy",
                    rules_regex="(installed|replaced|led|bulbs)"
                ),
                Challenge(
                    title="Go Car-Free for a Day",
                    description="Walk or bike.",
                    points_reward=100,
                    category="transportation",
                    rules_regex="(walked|biked|cycled|bus)"
                ),
                Challenge(
                    title="Start Composting",
                    description="Compost organic kitchen waste.",
                    points_reward=75,
                    category="waste",
                    rules_regex="(compost|organic|peels)"
                )
            ]
            db.session.bulk_save_objects(challenges)
            db.session.commit()
            
        yield app
        
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def auth_headers(client):
    # Register and login to generate headers
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    
    res = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    
    token = res.get_json()['token']
    return {'Authorization': f'Bearer {token}'}
