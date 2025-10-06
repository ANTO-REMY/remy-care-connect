from .app import db

class MotherCHWAssignment(db.Model):
    __tablename__ = 'mother_chw_assignments'
    id = db.Column(db.Integer, primary_key=True)
    chw_id = db.Column(db.Integer, db.ForeignKey('chws.id'), nullable=False)
    mother_id = db.Column(db.Integer, db.ForeignKey('mothers.id'), nullable=False)
    __table_args__ = (db.UniqueConstraint('chw_id', 'mother_id', name='unique_chw_mother'),)

class Escalation(db.Model):
    __tablename__ = 'escalations'
    id = db.Column(db.Integer, primary_key=True)
    chw_id = db.Column(db.Integer, db.ForeignKey('chws.id'), nullable=False)
    chw_name = db.Column(db.String, nullable=False)
    nurse_id = db.Column(db.Integer, db.ForeignKey('nurses.id'), nullable=False)
    nurse_name = db.Column(db.String, nullable=False)
    mother_id = db.Column(db.Integer, db.ForeignKey('mothers.id'))
    mother_name = db.Column(db.String, nullable=False)
    case_description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    resolved_at = db.Column(db.DateTime)
