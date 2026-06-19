import os
import json
import datetime
import pytest
from database import db, User, FootprintEntry, Challenge, UserChallenge, BackupLog
from services.rate_limiter import ip_requests
from itsdangerous import URLSafeTimedSerializer

# 1. Config Profile Tests
def test_config_profiles(app):
    assert app.config['TESTING'] is True
    assert app.config['SQLALCHEMY_DATABASE_URI'] == 'sqlite:///:memory:'
    assert app.config['SECRET_KEY'] == 'test-secret-key-12345'
    assert app.config['TOKEN_EXPIRY_SECONDS'] == 300

# 2. Registration Validation Tests
def test_register_validation(client):
    # Test empty payload
    res = client.post('/api/auth/register', json={})
    assert res.status_code == 400
    
    # Test short username
    res = client.post('/api/auth/register', json={'username': 'te', 'email': 't@e.co', 'password': 'password'})
    assert res.status_code == 400
    assert b"Username must be at least 3 characters" in res.data
    
    # Test invalid email
    res = client.post('/api/auth/register', json={'username': 'test', 'email': 'invalid-email', 'password': 'password'})
    assert res.status_code == 400
    assert b"Invalid email format" in res.data
    
    # Test short password
    res = client.post('/api/auth/register', json={'username': 'test', 'email': 't@e.co', 'password': '123'})
    assert res.status_code == 400
    assert b"Password must be at least 6 characters" in res.data

# 3. Login Validation Tests
def test_login_validation(client):
    # Seed a user
    client.post('/api/auth/register', json={'username': 'logintest', 'email': 'login@test.com', 'password': 'password123'})
    
    # Invalid password
    res = client.post('/api/auth/login', json={'email': 'login@test.com', 'password': 'wrongpassword'})
    assert res.status_code == 401
    
    # Non-existent user
    res = client.post('/api/auth/login', json={'email': 'nobody@test.com', 'password': 'password123'})
    assert res.status_code == 401

# 4. Token Security Tests
def test_token_auth_security(client):
    # Request profile without token
    res = client.get('/api/auth/profile')
    assert res.status_code == 401
    assert b"Authentication token is missing" in res.data
    
    # Request profile with bad token
    res = client.get('/api/auth/profile', headers={'Authorization': 'Bearer badtoken123'})
    assert res.status_code == 401
    assert b"Authentication token is invalid" in res.data

# 5. Tracker Entry Success Tests
def test_tracker_entry_valid(client, auth_headers):
    res = client.post('/api/tracker/entry', json={
        'transportation': 120.5,
        'energy': 85.0,
        'waste': 15.2,
        'diet': 50.0
    }, headers=auth_headers)
    assert res.status_code == 201
    data = res.get_json()
    assert data['entry']['total_emission'] == 270.7
    assert data['entry']['transportation'] == 120.5

# 6. Tracker Boundary / Validation Limit Tests
def test_tracker_entry_bounds(client, auth_headers):
    # Test negative value
    res = client.post('/api/tracker/entry', json={
        'transportation': -10.0,
        'energy': 85.0,
        'waste': 15.2,
        'diet': 50.0
    }, headers=auth_headers)
    assert res.status_code == 400
    assert b"cannot be negative" in res.data
    
    # Test excessively large value
    res = client.post('/api/tracker/entry', json={
        'transportation': 999999.9,
        'energy': 0.0,
        'waste': 0.0,
        'diet': 0.0
    }, headers=auth_headers)
    assert res.status_code == 400
    assert b"exceed maximum limits" in res.data

# 7. Rate Limiting Tests (Asserting 429 Status Code)
def test_tracker_rate_limiting(app, client):
    app.config['TEST_RATE_LIMITING'] = True
    # Clear rate limiter cache
    ip_requests.clear()
    
    # Limit for auth is 10 requests per 60 seconds
    # Send 10 requests quickly
    for i in range(10):
        client.post('/api/auth/register', json={})
        
    # The 11th request must trigger a 429 rate limit error
    res = client.post('/api/auth/register', json={})
    assert res.status_code == 429
    assert b"Too Many Requests" in res.data
    
    # Clean up config flag
    app.config['TEST_RATE_LIMITING'] = False

# 8. Analytics Slices / Period Filtering Tests
def test_analytics_filter_slices(app, client, auth_headers):
    with app.app_context():
        user = User.query.filter_by(username='testuser').first()
        now = datetime.datetime.utcnow()
        
        # Clear existing entries
        FootprintEntry.query.filter_by(user_id=user.id).delete()
        
        # Add 3 entries at different dates
        # Entry 1: 10 days ago (within 3m, 6m, ytd)
        e1 = FootprintEntry(user_id=user.id, transportation=10.0, energy=10.0, waste=10.0, diet=10.0, total_emission=40.0, recorded_at=now - datetime.timedelta(days=10))
        # Entry 2: 100 days ago (within 6m, ytd)
        e2 = FootprintEntry(user_id=user.id, transportation=20.0, energy=20.0, waste=20.0, diet=20.0, total_emission=80.0, recorded_at=now - datetime.timedelta(days=100))
        # Entry 3: 200 days ago (outside 3m and 6m, but YTD if in same year)
        e3 = FootprintEntry(user_id=user.id, transportation=30.0, energy=30.0, waste=30.0, diet=30.0, total_emission=120.0, recorded_at=now - datetime.timedelta(days=200))
        
        db.session.add_all([e1, e2, e3])
        db.session.commit()
        
    # Query 3 Months
    res = client.get('/api/tracker/history?period=3m', headers=auth_headers)
    assert res.status_code == 200
    assert len(res.get_json()) == 1
    assert res.get_json()[0]['total_emission'] == 40.0
    
    # Query 6 Months
    res = client.get('/api/tracker/history?period=6m', headers=auth_headers)
    assert res.status_code == 200
    assert len(res.get_json()) == 2
    
    # Query All
    res = client.get('/api/tracker/history?period=all', headers=auth_headers)
    assert res.status_code == 200
    assert len(res.get_json()) == 3

# 9. Target Comparison Tests
def test_target_averages_comparison(client, auth_headers):
    # Add some entries
    client.post('/api/tracker/entry', json={'transportation': 100, 'energy': 100, 'waste': 50, 'diet': 50}, headers=auth_headers)
    client.post('/api/tracker/entry', json={'transportation': 200, 'energy': 200, 'waste': 100, 'diet': 100}, headers=auth_headers)
    
    res = client.get('/api/tracker/compare', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['user_average'] == 450.0  # Average of 300 and 600
    assert data['national_target'] == 600.0
    assert data['global_target'] == 350.0
    assert data['status'] == 'Over Global Target'

# 10. AI Recommendation Fallback Tests
def test_gemini_fallback_logic(app, client, auth_headers):
    # Ensure GEMINI_API_KEY is empty to trigger fallback logic
    app.config['GEMINI_API_KEY'] = ''
    
    # Set high transport footprint
    client.post('/api/tracker/entry', json={'transportation': 500, 'energy': 10, 'waste': 10, 'diet': 10}, headers=auth_headers)
    
    res = client.get('/api/recommendations', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['source'] == 'Fallback Rule Engine'
    assert data['category'] == 'transportation'
    assert len(data['recommendations']) == 3
    assert data['recommendations'][0]['title'] == 'Transition to Active Transport'

# 11. Custom CLI Backup Tests
def test_cli_db_backup(client, runner, app):
    # Invoke db-backup
    result = runner.invoke(args=['db-backup'])
    assert result.exit_code == 0
    assert "Database backup created successfully" in result.output
    
    # Verify backup record in DB
    with app.app_context():
        log = BackupLog.query.order_by(BackupLog.id.desc()).first()
        assert log is not None
        assert log.record_count > 0
        
        # Verify file exists
        filepath = os.path.join(os.getcwd(), 'backups', log.filename)
        assert os.path.exists(filepath)
        
        # Clean up file
        os.remove(filepath)

# 12. Challenges Audit & Points Progress Flow Tests
def test_challenges_audit_flow(app, client, auth_headers):
    # Verify challenges exist
    res = client.get('/api/challenges', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert len(data['available']) > 0
    
    challenge_id = data['available'][0]['id']
    challenge_title = data['available'][0]['title']
    
    # Accept challenge
    res = client.post(f'/api/challenges/accept/{challenge_id}', headers=auth_headers)
    assert res.status_code == 201
    
    # Submit incorrect proof (failing rules_regex)
    res = client.post(f'/api/challenges/submit/{challenge_id}', json={'proof_text': 'I just slept all day.'}, headers=auth_headers)
    assert res.status_code == 400
    assert b"proof text did not satisfy the challenge validation rules" in res.data
    
    # Submit correct proof (matching rules_regex)
    # The default challenge is LED bulb, which requires matching (installed|replaced|led|bulbs)
    res = client.post(f'/api/challenges/submit/{challenge_id}', json={'proof_text': 'I replaced old light bulbs with new energy efficient LEDs.'}, headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['points_awarded'] == 50
    assert data['total_points'] == 50
    
    # Check that points are updated in profile
    profile_res = client.get('/api/auth/profile', headers=auth_headers)
    assert profile_res.get_json()['user']['points'] == 50

# 13. Carbon Offsets & Nature Projects Flow Tests
def test_offsets_flow(app, client, auth_headers):
    # Verify offsets GET endpoint lists projects
    res = client.get('/api/offsets', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'projects' in data
    assert 'transactions' in data
    assert len(data['projects']) > 0
    assert data['total_offset'] == 0
    
    reforestation_proj = next(p for p in data['projects'] if p['id'] == 'reforestation')
    assert reforestation_proj['points_cost'] == 50
    assert reforestation_proj['co2_offset'] == 20.0
    
    # Try to purchase with 0 points (should fail with 403 Forbidden)
    res = client.post('/api/offsets/purchase', json={'project_id': 'reforestation'}, headers=auth_headers)
    assert res.status_code == 403
    assert b"Insufficient Green Points" in res.data
    
    # Earn 50 points by completing a challenge
    challenges_res = client.get('/api/challenges', headers=auth_headers)
    c_data = challenges_res.get_json()
    challenge_id = c_data['available'][0]['id']
    
    client.post(f'/api/challenges/accept/{challenge_id}', headers=auth_headers)
    client.post(f'/api/challenges/submit/{challenge_id}', json={'proof_text': 'I replaced old light bulbs with new energy efficient LEDs.'}, headers=auth_headers)
    
    # Verify user points are now 50
    profile_res = client.get('/api/auth/profile', headers=auth_headers)
    assert profile_res.get_json()['user']['points'] == 50
    
    # Purchase reforestation project (costs 50 points)
    res = client.post('/api/offsets/purchase', json={'project_id': 'reforestation'}, headers=auth_headers)
    assert res.status_code == 201
    purchase_data = res.get_json()
    assert purchase_data['user']['points'] == 0
    assert purchase_data['transaction']['project_name'] == reforestation_proj['title']
    assert purchase_data['transaction']['co2_offset'] == 20.0
    
    # Get offsets list again
    res = client.get('/api/offsets', headers=auth_headers)
    data = res.get_json()
    assert len(data['transactions']) == 1
    assert data['total_offset'] == 20.0
    
    # Verify compare endpoint reflects the offsets
    compare_res = client.get('/api/tracker/compare', headers=auth_headers)
    assert compare_res.status_code == 200
    comp_data = compare_res.get_json()
    assert comp_data['total_offset'] == 20.0


def test_ai_chat_flow(client):
    """Verify AI chat endpoint validation and streaming response."""
    # Register and login
    client.post('/api/auth/register', json={
        'username': 'chat_user',
        'email': 'chat@example.com',
        'password': 'password123'
    })
    login_res = client.post('/api/auth/login', json={
        'email': 'chat@example.com',
        'password': 'password123'
    })
    token = login_res.get_json()['token']
    auth_headers = {'Authorization': f'Bearer {token}'}

    # Test error when message is empty
    res = client.post('/api/ai/chat', json={'message': ''}, headers=auth_headers)
    assert res.status_code == 400

    # Test valid streaming request (hits fallback generator in test environment)
    res = client.post('/api/ai/chat', json={'message': 'How do I reduce my carbon footprint?'}, headers=auth_headers)
    assert res.status_code == 200
    assert res.mimetype == 'text/event-stream'
    
    # Read streamed output
    data = res.data.decode('utf-8')
    assert "data:" in data
    assert "Advisor" in data or "offline" in data


def test_demo_login_flow(client):
    """Verify demo mode logins and pre-seeding works correctly."""
    res = client.post('/api/auth/demo')
    assert res.status_code == 200
    data = res.get_json()
    assert 'token' in data
    assert data['user']['username'] == 'Demo Judge'
    assert data['user']['points'] == 150


def test_api_health_check(client):
    """Verify system health endpoint returns aggregate metrics."""
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'
    assert 'metrics' in data
    assert 'total_co2_offset_kg' in data['metrics']
    assert 'active_users' in data['metrics']



