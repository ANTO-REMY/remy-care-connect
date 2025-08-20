from .app import db

# User model: stores all users (mothers, CHWs, nurses) with authentication info
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    pin_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum('mother', 'chw', 'nurse', name='user_roles'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)
    mother = db.relationship('Mother', backref='user', uselist=False)
    healthworker = db.relationship('HealthWorker', backref='user', uselist=False)

# Mother model: profile and demographic info for mothers, linked to User
class Mother(db.Model):
    __tablename__ = 'mothers'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    mother_name = db.Column(db.String(128), nullable=False)
    dob = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

# HealthWorker model: profile for CHWs and nurses, linked to User
class HealthWorker(db.Model):
    __tablename__ = 'healthworkers'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    chw_name = db.Column(db.String(128))
    nurse_name = db.Column(db.String(128))
    type = db.Column(db.Enum('chw', 'nurse', name='healthworker_types'), nullable=False)
    license_number = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

# Verification model: stores OTP codes for phone verification, linked to User if exists
class Verification(db.Model):
    __tablename__ = 'verifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    phone_number = db.Column(db.String(20), nullable=False)
    code = db.Column(db.String(5), nullable=False)
    status = db.Column(db.Enum('pending', 'verified', 'expired', name='verification_status'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
