from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import User

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/doctors', methods=['GET'])
@jwt_required()
def get_doctors():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    if admin.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    doctors = User.query.filter_by(role='doctor').order_by(User.created_at.desc()).all()
    return jsonify([{
        'id': d.id, 
        'name': d.name, 
        'email': d.email, 
        'is_verified': d.is_verified,
        'created_at': d.created_at.isoformat() if d.created_at else None
    } for d in doctors]), 200

@admin_bp.route('/doctors/<int:doctor_id>/verify', methods=['POST'])
@jwt_required()
def verify_doctor(doctor_id):
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    if admin.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    doctor = User.query.get(doctor_id)
    if not doctor or doctor.role != 'doctor':
        return jsonify({'error': 'Doctor not found'}), 404
        
    try:
        data = request.get_json()
        is_verified = data.get('is_verified', True)
        doctor.is_verified = is_verified
        db.session.commit()
        return jsonify({'message': f"Doctor {'verified' if is_verified else 'unverified'} successfully"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
