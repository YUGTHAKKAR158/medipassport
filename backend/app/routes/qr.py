import os
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User
from ..utils.qr_generator import generate_qr

qr_bp = Blueprint('qr', __name__)

@qr_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_qr(patient_id):
    user = User.query.get_or_404(patient_id)

    # Priority 1: explicit env var (set via start.sh or docker-compose)
    base_url = os.environ.get('APP_BASE_URL', '').strip()

    # Priority 2: derive from the incoming request host
    if not base_url:
        host = request.host  # e.g. "13.201.124.52:5000"
        # Replace backend port 5000 with frontend port 3000
        if ':5000' in host:
            host = host.replace(':5000', ':3000')
        base_url = f"http://{host}"

    url = f"{base_url}/emergency/{user.health_id}"
    qr_base64 = generate_qr(url)
    return jsonify({'qr_code': qr_base64, 'health_id': user.health_id}), 200