import os
import uuid
import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import MedicalRecord, AccessRequest, User

records_bp = Blueprint('records', __name__)

UPLOAD_FOLDER = os.path.normpath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'uploads')
)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_files(files):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file_urls = []
    for file in files:
        if file and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = str(uuid.uuid4()) + '.' + ext
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            file_urls.append('/uploads/' + filename)
    return file_urls

def delete_files(file_urls_json):
    if not file_urls_json:
        return
    for url in json.loads(file_urls_json):
        filename = url.split('/')[-1]
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(filepath):
            os.remove(filepath)

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

    file_urls = save_files(request.files.getlist('files'))

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
        kept = [u for u in existing_urls if u not in removed]
        for url in removed:
            filename = url.split('/')[-1]
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(filepath):
                os.remove(filepath)

        new_urls = save_files(request.files.getlist('files'))
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

    delete_files(record.file_urls)
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