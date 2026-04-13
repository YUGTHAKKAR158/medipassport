from flask import Blueprint, jsonify
from ..models import User, PatientProfile

emergency_bp = Blueprint('emergency', __name__)

@emergency_bp.route('/<health_id>', methods=['GET'])
def get_emergency_info(health_id):
    user = User.query.filter_by(health_id=health_id).first()
    if not user:
        return jsonify({'error': 'Patient not found'}), 404
    profile = PatientProfile.query.filter_by(patient_id=user.id).first()
    return jsonify({
        'name': user.name,
        'blood_type': profile.blood_type if profile else 'Unknown',
        'allergies': profile.allergies if profile else 'None recorded',
        'chronic_conditions': profile.chronic_conditions if profile else 'None recorded',
        'current_medications': profile.current_medications if profile else 'None recorded',
        'emergency_contact_name': profile.emergency_contact_name if profile else '',
        'emergency_contact_phone': profile.emergency_contact_phone if profile else '',
        'date_of_birth': profile.date_of_birth if profile else ''
    }), 200