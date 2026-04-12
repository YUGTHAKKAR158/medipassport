import os
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User
from ..utils.qr_generator import generate_qr

qr_bp = Blueprint('qr', __name__)

@qr_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_qr(patient_id):
    user = User.query.get_or_404(patient_id)
    base_url = os.environ.get('APP_BASE_URL', '')
    url = f"{base_url}/emergency/{user.health_id}"
    qr_base64 = generate_qr(url)
    return jsonify({'qr_code': qr_base64, 'health_id': user.health_id}), 200