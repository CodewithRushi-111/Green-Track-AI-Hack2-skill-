import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'greentrack-super-secret-key-change-in-prod'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or ''
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY') or ''
    TOKEN_EXPIRY_SECONDS = 7200  # 2 hours

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///greentrack_dev.db'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test-secret-key-12345'
    TOKEN_EXPIRY_SECONDS = 300  # 5 minutes for tests

class ProductionConfig(Config):
    DEBUG = False
    
    # Safely retrieve DATABASE_URL, normalise postgres:// prefix to postgresql:// for SQLAlchemy,
    # and default to a writable SQLite database in Vercel's /tmp directory if no URL is provided.
    db_url = os.environ.get('DATABASE_URL')
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = db_url or 'sqlite:////tmp/greentrack_prod.db'

