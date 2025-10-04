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
    location = db.Column(db.String(128), nullable=False)
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

# AppointmentSchedule model: recurring appointments and escalation
class AppointmentSchedule(db.Model):
    __tablename__ = 'appointment_schedule'
    id = db.Column(db.Integer, primary_key=True)
    mother_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    health_worker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    recurrence_rule = db.Column(db.String)
    recurrence_end = db.Column(db.DateTime)
    status = db.Column(db.Enum('scheduled', 'completed', 'canceled', name='appointment_status'), nullable=False)
    escalated = db.Column(db.Boolean, default=False)
    escalation_reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

# MedicalRecordType model: extensible enum for record types
class MedicalRecordType(db.Model):
    __tablename__ = 'medical_record_type'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

# EducationalMaterial model: text or file uploads for CHW/nurse
class EducationalMaterial(db.Model):
    __tablename__ = 'educational_material'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    content = db.Column(db.Text)
    file_url = db.Column(db.String)
    category = db.Column(db.String)
    audience = db.Column(db.Enum('chw', 'nurse', 'both', name='educational_audience'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

# DietaryRecommendation model: nutrition advice for mothers
class DietaryRecommendation(db.Model):
    __tablename__ = 'dietary_recommendation'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    content = db.Column(db.Text, nullable=False)
    target_group = db.Column(db.String)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)
