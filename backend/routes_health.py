from flask import Blueprint

bp = Blueprint('health', __name__)

@bp.route('/health', methods=['GET'])
def healthcheck():
    return {"status": "ok"}, 200
