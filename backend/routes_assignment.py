from flask import Blueprint, jsonify, request
from .models import db, CHW, Mother, User, Nurse
from .models_standard import MotherCHWAssignment, Escalation
from datetime import datetime

bp = Blueprint('assignment', __name__)

@bp.route('/chws/<int:chw_id>/mothers', methods=['GET'])
def get_assigned_mothers(chw_id):
    assignments = MotherCHWAssignment.query.filter_by(chw_id=chw_id).all()
    result = []
    for assignment in assignments:
        mother = Mother.query.get(assignment.mother_id)
        user = User.query.get(mother.user_id)
        result.append({
            "mother_id": mother.id,
            "name": mother.mother_name,
            "phone": user.phone_number,
            "location": mother.location
        })
    return jsonify({"mothers": result}), 200

@bp.route('/chws/<int:chw_id>/assign_mother', methods=['POST'])
def assign_mother_to_chw(chw_id):
    data = request.get_json()
    mother_id = data.get('mother_id')
    if not mother_id:
        return jsonify({"error": "mother_id is required."}), 400
    existing_assignments = MotherCHWAssignment.query.filter_by(chw_id=chw_id).count()
    if existing_assignments >= 2:
        return jsonify({"error": "CHW already has 2 mothers assigned."}), 400
    if MotherCHWAssignment.query.filter_by(chw_id=chw_id, mother_id=mother_id).first():
        return jsonify({"error": "Mother already assigned to this CHW."}), 400
    assignment = MotherCHWAssignment(chw_id=chw_id, mother_id=mother_id)
    db.session.add(assignment)
    db.session.commit()
    return jsonify({"message": "Mother assigned to CHW."}), 201

@bp.route('/chws/<int:chw_id>/escalate', methods=['POST'])
def escalate_case(chw_id):
    data = request.get_json()
    nurse_id = data.get('nurse_id')
    mother_id = data.get('mother_id')
    case_description = data.get('case_description')
    if not (nurse_id and mother_id and case_description):
        return jsonify({"error": "nurse_id, mother_id, and case_description are required."}), 400
    chw = CHW.query.get(chw_id)
    nurse = Nurse.query.get(nurse_id)
    mother = Mother.query.get(mother_id)
    if not chw or not nurse or not mother:
        return jsonify({"error": "CHW, Nurse, or Mother not found."}), 404
    escalation = Escalation(
        chw_id=chw.id,
        chw_name=chw.chw_name,
        nurse_id=nurse.id,
        nurse_name=nurse.nurse_name,
        mother_id=mother.id,
        mother_name=mother.mother_name,
        case_description=case_description,
        status='pending',
        created_at=datetime.utcnow(),
        resolved_at=None
    )
    db.session.add(escalation)
    db.session.commit()
    return jsonify({"message": "Case escalated to nurse."}), 201
