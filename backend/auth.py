from flask import Blueprint, request, jsonify
from .models import db, User
import hashlib
from datetime import datetime
from sqlalchemy.exc import IntegrityError

bp = Blueprint('auth', __name__)

@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    phone = data.get('phone')
    pin = data.get('pin')
    if not phone or not pin:
        return jsonify({"error": "Phone and PIN are required."}), 400
    user = User.query.filter_by(phone_number=phone, role='mother').first()
    if not user or user.pin_hash != hashlib.sha256(pin.encode()).hexdigest():
        return jsonify({"error": "Invalid phone or PIN."}), 401
    return jsonify({"message": "Login successful", "user_id": user.id}), 200
