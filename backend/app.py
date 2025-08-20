from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

# Load environment variables from .env if present
load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/postgres')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    migrate.init_app(app, db)

    from backend.routes_health import bp as health_bp
    from backend.routes_auth import bp as auth_bp
    from backend.routes_mothers import bp as mothers_bp
    from backend.routes_verifications import bp as verifications_bp
    app.register_blueprint(health_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1')
    app.register_blueprint(mothers_bp, url_prefix='/api/v1')
    app.register_blueprint(verifications_bp, url_prefix='/api/v1')

    return app
