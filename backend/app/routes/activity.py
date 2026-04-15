from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .. import db
from ..models import ActivityLog

activity_bp = Blueprint('activity', __name__)

@activity_bp.route('/', methods=['GET'])
@jwt_required()
def get_activity():
    user_id = int(get_jwt_identity())
    limit = request.args.get('limit', 20, type=int)
    logs = ActivityLog.query.filter_by(user_id=user_id).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
    
    return jsonify([{
        'id': log.id,
        'action_type': log.action_type,
        'description': log.description,
        'ip_address': log.ip_address,
        'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    } for log in logs]), 200

@activity_bp.route('/', methods=['POST'])
@jwt_required()
def log_activity():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    log = ActivityLog(
        user_id=user_id,
        action_type=data.get('action_type', 'System Action'),
        description=data.get('description', 'No description provided.'),
        ip_address=ip_address
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'message': 'Logged'}), 201
