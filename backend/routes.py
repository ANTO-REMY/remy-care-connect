from flask import Blueprint, jsonify

bp = Blueprint('routes', __name__)

@bp.route('/', methods=['GET'])
def healthcheck():
    return jsonify({"status": "ok"}), 200
