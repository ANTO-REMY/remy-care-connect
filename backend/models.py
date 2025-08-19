from .app import db

class Mother(db.Model):
    __tablename__ = 'mothers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
