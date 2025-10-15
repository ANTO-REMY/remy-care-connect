from flask import Blueprint, request, jsonify
from .models import db, User, Mother
from datetime import datetime
from sqlalchemy.exc import IntegrityError
import hashlib

bp = Blueprint('mothers', __name__)

@bp.route('/mothers/register', methods=['POST'])
def register_mother():
    data = request.get_json()
    required_fields = ['full_name', 'phone', 'dob', 'due_date', 'location', 'pin', 'confirm_pin']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required."}), 400
    if data['pin'] != data['confirm_pin']:
        return jsonify({"error": "PIN and Confirm PIN do not match."}), 400
    if User.query.filter_by(phone_number=data['phone']).first():
        return jsonify({"error": "Phone number already registered."}), 409
    try:
        pin_hash = hashlib.sha256(data['pin'].encode()).hexdigest()
        now = datetime.utcnow()
        user = User(
            phone_number=data['phone'],
            name=data['full_name'],
            pin_hash=pin_hash,
            role='mother',
            created_at=now,
            updated_at=now
        )
        db.session.add(user)
        db.session.flush()
        mother = Mother(
            user_id=user.id,
            mother_name=data['full_name'],
            dob=datetime.strptime(data['dob'], '%Y-%m-%d'),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d'),
            location=data['location'],
            created_at=now
        )
        db.session.add(mother)
        db.session.commit()
        return jsonify({"message": "Mother registered successfully", "mother_id": mother.id}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Failed to register mother. Phone may already exist."}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/mothers/<int:mother_id>', methods=['GET'])
def get_mother_profile(mother_id):
    mother = Mother.query.get(mother_id)
    if not mother:
        return jsonify({"error": "Mother not found."}), 404
    user = User.query.get(mother.user_id)
    return jsonify({
        "mother_id": mother.id,
        "user_id": user.id,
        "name": mother.mother_name,
        "dob": mother.dob.strftime('%Y-%m-%d'),
        "due_date": mother.due_date.strftime('%Y-%m-%d'),
        "location": mother.location,
        "phone": user.phone_number
    }), 200

@bp.route('/mothers/<int:mother_id>', methods=['PUT'])
def update_mother_profile(mother_id):
    mother = Mother.query.get(mother_id)
    if not mother:
        return jsonify({"error": "Mother not found."}), 404
    data = request.get_json()
    updated = False
    if 'full_name' in data and data['full_name']:
        mother.mother_name = data['full_name']
        user = User.query.get(mother.user_id)
        user.name = data['full_name']
        updated = True
    if 'dob' in data and data['dob']:
        try:
            mother.dob = datetime.strptime(data['dob'], '%Y-%m-%d')
            updated = True
        except Exception:
            return jsonify({"error": "Invalid dob format. Use YYYY-MM-DD."}), 400
    if 'due_date' in data and data['due_date']:
        try:
            mother.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d')
            updated = True
        except Exception:
            return jsonify({"error": "Invalid due_date format. Use YYYY-MM-DD."}), 400
    if 'location' in data and data['location']:
        mother.location = data['location']
        updated = True
    if not updated:
        return jsonify({"error": "No valid fields to update."}), 400
    db.session.commit()
    return jsonify({"message": "Mother profile updated successfully."}), 200

@bp.route('/mothers/<int:mother_id>', methods=['DELETE'])
def delete_mother_profile(mother_id):
    mother = Mother.query.get(mother_id)
    if not mother:
        return jsonify({"error": "Mother not found."}), 404
    user = User.query.get(mother.user_id)
    db.session.delete(mother)
    if user:
        db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Mother profile deleted successfully."}), 200
