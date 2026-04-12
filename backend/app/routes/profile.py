from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import User

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify({
        'name': user.name,
        'email': user.email,
        'health_id': user.health_id,
        'role': user.role,
        'blood_group': user.blood_group,
        'allergies': user.allergies,
        'emergency_contact_name': user.emergency_contact_name,
        'emergency_contact_phone': user.emergency_contact_phone
    }), 200

@profile_bp.route('', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    user.blood_group = data.get('blood_group', user.blood_group)
    user.allergies = data.get('allergies', user.allergies)
    user.emergency_contact_name = data.get('emergency_contact_name', user.emergency_contact_name)
    user.emergency_contact_phone = data.get('emergency_contact_phone', user.emergency_contact_phone)
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200

@profile_bp.route('/emergency/<health_id>', methods=['GET'])
def get_emergency_profile(health_id):
    user = User.query.filter_by(health_id=health_id).first()
    if not user:
        return jsonify({'error': 'Patient not found'}), 404
    return jsonify({
        'name': user.name,
        'blood_group': user.blood_group or 'Not specified',
        'allergies': user.allergies or 'None recorded',
        'emergency_contact_name': user.emergency_contact_name or 'Not specified',
        'emergency_contact_phone': user.emergency_contact_phone or 'Not specified',
        'health_id': user.health_id
    }), 200
