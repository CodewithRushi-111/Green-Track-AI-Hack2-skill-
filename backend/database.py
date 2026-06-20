import datetime
import bcrypt
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relationships
    entries = db.relationship('FootprintEntry', backref='user', lazy=True, cascade='all, delete-orphan')
    challenges = db.relationship('UserChallenge', backref='user', lazy=True, cascade='all, delete-orphan')
    offsets = db.relationship('OffsetTransaction', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):

        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'points': self.points,
            'created_at': self.created_at.isoformat()
        }

class FootprintEntry(db.Model):
    __tablename__ = 'footprint_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    transportation = db.Column(db.Float, nullable=False)  # kg CO2
    energy = db.Column(db.Float, nullable=False)          # kg CO2
    waste = db.Column(db.Float, nullable=False)           # kg CO2
    diet = db.Column(db.Float, nullable=False)            # kg CO2
    total_emission = db.Column(db.Float, nullable=False)   # kg CO2
    recorded_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'transportation': self.transportation,
            'energy': self.energy,
            'waste': self.waste,
            'diet': self.diet,
            'total_emission': self.total_emission,
            'recorded_at': self.recorded_at.isoformat()
        }

class Challenge(db.Model):
    __tablename__ = 'challenges'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    points_reward = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(80), nullable=False)  # transport, energy, waste, diet
    rules_regex = db.Column(db.String(255), nullable=False)  # Regex for verification of proof_text

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'points_reward': self.points_reward,
            'category': self.category,
            'rules_regex': self.rules_regex
        }

class UserChallenge(db.Model):
    __tablename__ = 'user_challenges'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(50), default='active')  # active, completed
    proof_text = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationship
    challenge = db.relationship('Challenge')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'challenge_id': self.challenge_id,
            'challenge_title': self.challenge.title if self.challenge else '',
            'challenge_description': self.challenge.description if self.challenge else '',
            'points_reward': self.challenge.points_reward if self.challenge else 0,
            'status': self.status,
            'proof_text': self.proof_text,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class BackupLog(db.Model):
    __tablename__ = 'backup_logs'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    record_count = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'created_at': self.created_at.isoformat(),
            'record_count': self.record_count
        }

class OffsetTransaction(db.Model):
    __tablename__ = 'offset_transactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_name = db.Column(db.String(120), nullable=False)
    co2_offset = db.Column(db.Float, nullable=False)  # kg CO2 offset
    points_spent = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_name': self.project_name,
            'co2_offset': self.co2_offset,
            'points_spent': self.points_spent,
            'created_at': self.created_at.isoformat()
        }

