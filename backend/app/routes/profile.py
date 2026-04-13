from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import PatientProfile, AccessRequest

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    profile = PatientProfile.query.filter_by(patient_id=user_id).first()
    if not profile:
        return jsonify({}), 200
    return jsonify({
        'blood_type': profile.blood_type,
        'allergies': profile.allergies,
        'chronic_conditions': profile.chronic_conditions,
        'current_medications': profile.current_medications,
        'emergency_contact_name': profile.emergency_contact_name,
        'emergency_contact_phone': profile.emergency_contact_phone,
        'date_of_birth': profile.date_of_birth,
        'gender': profile.gender
    }), 200

@profile_bp.route('', methods=['POST'])
@jwt_required()
def save_profile():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    profile = PatientProfile.query.filter_by(patient_id=user_id).first()
    if not profile:
        profile = PatientProfile(patient_id=user_id)
        db.session.add(profile)
    profile.blood_type = data.get('blood_type', '')
    profile.allergies = data.get('allergies', '')
    profile.chronic_conditions = data.get('chronic_conditions', '')
    profile.current_medications = data.get('current_medications', '')
    profile.emergency_contact_name = data.get('emergency_contact_name', '')
    profile.emergency_contact_phone = data.get('emergency_contact_phone', '')
    profile.date_of_birth = data.get('date_of_birth', '')
    profile.gender = data.get('gender', '')
    db.session.commit()
    return jsonify({'message': 'Profile saved'}), 200

@profile_bp.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_profile(patient_id):
    doctor_id = int(get_jwt_identity())
    approved = AccessRequest.query.filter_by(
        doctor_id=doctor_id,
        patient_id=patient_id,
        status='approved'
    ).first()
    if not approved:
        return jsonify({'error': 'Access not granted'}), 403
    profile = PatientProfile.query.filter_by(patient_id=patient_id).first()
    if not profile:
        return jsonify({}), 200
    return jsonify({
        'blood_type': profile.blood_type,
        'allergies': profile.allergies,
        'chronic_conditions': profile.chronic_conditions,
        'current_medications': profile.current_medications,
        'emergency_contact_name': profile.emergency_contact_name,
        'emergency_contact_phone': profile.emergency_contact_phone,
        'date_of_birth': profile.date_of_birth,
        'gender': profile.gender
    }), 200