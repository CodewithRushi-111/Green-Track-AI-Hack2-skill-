import os
import json
import datetime
import click
from flask.cli import with_appcontext
from database import db, User, FootprintEntry, Challenge, UserChallenge, BackupLog

@click.command('db-backup')
@with_appcontext
def db_backup_command():
    """
    Export database states into timestamped JSON files.
    """
    # Create backups folder inside the workspace
    backup_dir = os.path.join(os.getcwd(), 'backups')
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        
    try:
        users = User.query.all()
        entries = FootprintEntry.query.all()
        challenges = Challenge.query.all()
        user_challenges = UserChallenge.query.all()
        backup_logs = BackupLog.query.all()
        
        # Serialize records using built-in model to_dict methods
        db_state = {
            'users': [u.to_dict() for u in users],
            'footprint_entries': [e.to_dict() for e in entries],
            'challenges': [c.to_dict() for c in challenges],
            'user_challenges': [uc.to_dict() for uc in user_challenges],
            'backup_logs': [b.to_dict() for b in backup_logs]
        }
        
        record_count = (
            len(users) + len(entries) + len(challenges) + len(user_challenges) + len(backup_logs)
        )
        
        # Output file details
        timestamp = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"backup_{timestamp}.json"
        filepath = os.path.join(backup_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(db_state, f, indent=4)
            
        # Register backup log in database
        log = BackupLog(filename=filename, record_count=record_count)
        db.session.add(log)
        db.session.commit()
        
        click.echo(f"Database backup created successfully: {filename} ({record_count} total records).")
    except Exception as e:
        db.session.rollback()
        click.echo(f"Error creating database backup: {str(e)}", err=True)
