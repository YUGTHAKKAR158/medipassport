import os
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import MedicalRecord, AccessRequest, User
from ..utils.s3_helper import upload_file_to_s3, delete_file_from_s3

records_bp = Blueprint('records', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@records_bp.route('', methods=['GET'])
@jwt_required()
def get_records():
    user_id = int(get_jwt_identity())
    records = MedicalRecord.query.filter_by(patient_id=user_id).all()
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'record_type': r.record_type,
        'description': r.description,
        'file_urls': json.loads(r.file_urls) if r.file_urls else [],
        'date': r.date.isoformat()
    } for r in records]), 200

@records_bp.route('', methods=['POST'])
@jwt_required()
def add_record():
    doctor_id = int(get_jwt_identity())
    patient_id = request.form.get('patient_id')
    title = request.form.get('title')
    record_type = request.form.get('record_type')
    description = request.form.get('description', '')

    if not patient_id or not title:
        return jsonify({'error': 'Patient ID and title are required'}), 400

    approved = AccessRequest.query.filter_by(
        doctor_id=doctor_id,
        patient_id=int(patient_id),
        status='approved'
    ).first()
    if not approved:
        return jsonify({'error': 'You do not have approved access'}), 403

    file_urls = []
    files = request.files.getlist('files')
    for file in files:
        if file and allowed_file(file.filename):
            try:
                url = upload_file_to_s3(file, file.filename)
                file_urls.append(url)
            except Exception as e:
                print('Upload error:', e)

    record = MedicalRecord(
        patient_id=int(patient_id),
        title=title,
        record_type=record_type,
        description=description,
        file_urls=json.dumps(file_urls),
        created_by=doctor_id
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({'message': 'Record added successfully'}), 201

@records_bp.route('/<int:record_id>', methods=['PUT'])
@jwt_required()
def edit_record(record_id):
    user_id = int(get_jwt_identity())
    record = MedicalRecord.query.get_or_404(record_id)

    approved = AccessRequest.query.filter_by(
        doctor_id=user_id,
        patient_id=record.patient_id,
        status='approved'
    ).first()
    is_patient = (record.patient_id == user_id)

    if not approved and not is_patient:
        return jsonify({'error': 'Not authorized'}), 403

    if request.content_type and 'multipart/form-data' in request.content_type:
        record.title = request.form.get('title', record.title)
        record.record_type = request.form.get('record_type', record.record_type)
        record.description = request.form.get('description', record.description)

        existing_urls = json.loads(record.file_urls) if record.file_urls else []
        removed = request.form.getlist('removed_files')

        for url in removed:
            delete_file_from_s3(url)

        kept = [u for u in existing_urls if u not in removed]

        new_urls = []
        for file in request.files.getlist('files'):
            if file and allowed_file(file.filename):
                try:
                    url = upload_file_to_s3(file, file.filename)
                    new_urls.append(url)
                except Exception as e:
                    print('Upload error:', e)

        record.file_urls = json.dumps(kept + new_urls)
    else:
        data = request.get_json()
        record.title = data.get('title', record.title)
        record.record_type = data.get('record_type', record.record_type)
        record.description = data.get('description', record.description)

    db.session.commit()
    return jsonify({
        'message': 'Record updated',
        'file_urls': json.loads(record.file_urls) if record.file_urls else []
    }), 200

@records_bp.route('/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_record(record_id):
    user_id = int(get_jwt_identity())
    record = MedicalRecord.query.get_or_404(record_id)

    approved = AccessRequest.query.filter_by(
        doctor_id=user_id,
        patient_id=record.patient_id,
        status='approved'
    ).first()
    is_patient = (record.patient_id == user_id)

    if not approved and not is_patient:
        return jsonify({'error': 'Not authorized'}), 403

    if record.file_urls:
        for url in json.loads(record.file_urls):
            delete_file_from_s3(url)

    db.session.delete(record)
    db.session.commit()
    return jsonify({'message': 'Record deleted'}), 200

@records_bp.route('/patient/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient_records(patient_id):
    doctor_id = int(get_jwt_identity())
    approved = AccessRequest.query.filter_by(
        doctor_id=doctor_id,
        patient_id=patient_id,
        status='approved'
    ).first()
    if not approved:
        return jsonify({'error': 'Access not granted'}), 403
    records = MedicalRecord.query.filter_by(patient_id=patient_id).all()
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'record_type': r.record_type,
        'description': r.description,
        'file_urls': json.loads(r.file_urls) if r.file_urls else [],
        'date': r.date.isoformat()
    } for r in records]), 200