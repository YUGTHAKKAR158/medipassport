from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import AccessRequest, User
from datetime import datetime, timedelta

access_bp = Blueprint('access', __name__)

@access_bp.route('/request', methods=['POST'])
@jwt_required()
def request_access():
    doctor_id = int(get_jwt_identity())
    data = request.get_json()
    
    health_id = data.get('health_id', '').strip()
    if not health_id:
        return jsonify({'error': 'Health ID is required'}), 400

    patient = User.query.filter(User.health_id.ilike(health_id)).first()
    if not patient:
        return jsonify({'error': 'Patient not found. Check the Health ID.'}), 404
    
    if patient.id == doctor_id:
        return jsonify({'error': 'You cannot request access to your own account'}), 400

    existing = AccessRequest.query.filter_by(
        doctor_id=doctor_id, patient_id=patient.id, status='pending'
    ).first()
    if existing:
        return jsonify({'message': 'Request already sent'}), 200

    req = AccessRequest(doctor_id=doctor_id, patient_id=patient.id)
    db.session.add(req)
    db.session.commit()
    return jsonify({'message': 'Access requested'}), 201

@access_bp.route('/pending', methods=['GET'])
@jwt_required()
def get_pending():
    patient_id = int(get_jwt_identity())
    requests = AccessRequest.query.filter_by(patient_id=patient_id, status='pending').all()
    result = []
    for r in requests:
        doctor = User.query.get(r.doctor_id)
        result.append({'id': r.id, 'doctor_name': doctor.name, 'doctor_email': doctor.email})
    return jsonify(result), 200

@access_bp.route('/respond', methods=['POST'])
@jwt_required()
def respond_access():
    patient_id = int(get_jwt_identity())
    data = request.get_json()
    request_id = data.get('request_id')
    status = data.get('status')
    expiry_days = data.get('expiry_days', None)

    if not request_id or status not in ['approved', 'denied']:
        return jsonify({'error': 'Invalid data'}), 400

    access_req = AccessRequest.query.filter_by(
        id=request_id,
        patient_id=patient_id
    ).first()

    if not access_req:
        return jsonify({'error': 'Request not found'}), 404

    access_req.status = status

    if status == 'approved' and expiry_days:
        access_req.expires_at = datetime.utcnow() + timedelta(days=int(expiry_days))

    db.session.commit()
    return jsonify({'message': 'Access ' + status}), 200

@access_bp.route('/approved/<int:doctor_id>', methods=['GET'])
@jwt_required()
def get_approved_patients(doctor_id):
    now = datetime.utcnow()
    approved = AccessRequest.query.filter_by(
        doctor_id=doctor_id,
        status='approved'
    ).all()

    seen_patients = set()
    result = []
    for r in approved:
        if r.expires_at and r.expires_at < now:
            r.status = 'expired'
            db.session.commit()
            continue
        if r.patient_id not in seen_patients:
            seen_patients.add(r.patient_id)
            patient = User.query.get(r.patient_id)
            result.append({
                'request_id': r.id,
                'patient_id': patient.id,
                'patient_name': patient.name,
                'patient_email': patient.email,
                'health_id': patient.health_id,
                'expires_at': r.expires_at.isoformat() if r.expires_at else None
            })
    return jsonify(result), 200

@access_bp.route('/revoke/<int:request_id>', methods=['POST'])
@jwt_required()
def revoke_access(request_id):
    patient_id = int(get_jwt_identity())
    access_req = AccessRequest.query.filter_by(
        id=request_id,
        patient_id=patient_id
    ).first()
    if not access_req:
        return jsonify({'error': 'Not found'}), 404
    access_req.status = 'revoked'
    db.session.commit()
    return jsonify({'message': 'Access revoked'}), 200

@access_bp.route('/granted', methods=['GET'])
@jwt_required()
def get_granted_access():
    patient_id = int(get_jwt_identity())
    granted = AccessRequest.query.filter_by(
        patient_id=patient_id,
        status='approved'
    ).all()
    result = []
    for r in granted:
        doctor = User.query.get(r.doctor_id)
        result.append({
            'request_id': r.id,
            'doctor_name': doctor.name,
            'doctor_email': doctor.email,
            'expires_at': r.expires_at.isoformat() if r.expires_at else 'Permanent'
        })
    return jsonify(result), 200