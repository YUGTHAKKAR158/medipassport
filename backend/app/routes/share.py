from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import SharedRecord, MedicalRecord, User
from datetime import datetime, timedelta

share_bp = Blueprint('share', __name__)

@share_bp.route('/create', methods=['POST'])
@jwt_required()
def create_share():
    patient_id = int(get_jwt_identity())
    data = request.get_json()
    record_id = data.get('record_id')

    if not record_id:
        return jsonify({'error': 'Record ID is required'}), 400

    # Ensure record belongs to patient
    record = MedicalRecord.query.filter_by(id=record_id, patient_id=patient_id).first()
    if not record:
        return jsonify({'error': 'Record not found'}), 404

    expires_at = datetime.utcnow() + timedelta(hours=24)
    shared_record = SharedRecord(
        record_id=record_id,
        created_by=patient_id,
        expires_at=expires_at
    )
    db.session.add(shared_record)
    db.session.commit()

    return jsonify({
        'share_token': shared_record.share_token,
        'expires_at': shared_record.expires_at.isoformat()
    }), 201

@share_bp.route('/<token>', methods=['GET'])
def get_shared_record(token):
    shared = SharedRecord.query.filter_by(share_token=token, is_active=True).first()
    
    if not shared:
        return jsonify({'error': 'Invalid or expired link'}), 404
        
    if shared.expires_at < datetime.utcnow():
        shared.is_active = False
        db.session.commit()
        return jsonify({'error': 'This link has expired'}), 410

    shared.accessed_count += 1
    db.session.commit()

    record = MedicalRecord.query.get(shared.record_id)
    import json
    urls = []
    if record.file_urls:
        try:
            urls = json.loads(record.file_urls)
        except:
            urls = []

    return jsonify({
        'id': record.id,
        'title': record.title,
        'record_type': record.record_type,
        'description': record.description,
        'date': record.date.isoformat() if record.date else None,
        'file_urls': urls
    }), 200

@share_bp.route('/<token>', methods=['DELETE'])
@jwt_required()
def revoke_share(token):
    patient_id = int(get_jwt_identity())
    shared = SharedRecord.query.filter_by(share_token=token, created_by=patient_id).first()
    
    if not shared:
        return jsonify({'error': 'Share link not found'}), 404

    shared.is_active = False
    db.session.commit()
    return jsonify({'message': 'Share link revoked successfully'}), 200

@share_bp.route('/my-links', methods=['GET'])
@jwt_required()
def get_my_links():
    patient_id = int(get_jwt_identity())
    now = datetime.utcnow()
    
    # Auto-expire missed ones
    expired_links = SharedRecord.query.filter(SharedRecord.created_by == patient_id, SharedRecord.is_active == True, SharedRecord.expires_at < now).all()
    for el in expired_links:
        el.is_active = False
    if expired_links:
        db.session.commit()

    links = SharedRecord.query.filter_by(created_by=patient_id, is_active=True).order_by(SharedRecord.created_at.desc()).all()
    
    result = []
    for link in links:
        record = MedicalRecord.query.get(link.record_id)
        result.append({
            'share_token': link.share_token,
            'record_title': record.title if record else 'Unknown Record',
            'expires_at': link.expires_at.isoformat(),
            'accessed_count': link.accessed_count,
            'created_at': link.created_at.isoformat() if link.created_at else None
        })
        
    return jsonify(result), 200
