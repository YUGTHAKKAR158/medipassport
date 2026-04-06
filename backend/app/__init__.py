from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config
import os

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    from .routes.auth import auth_bp
    from .routes.records import records_bp
    from .routes.qr import qr_bp
    from .routes.access import access_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(records_bp, url_prefix='/api/records')
    app.register_blueprint(qr_bp, url_prefix='/api/qr')
    app.register_blueprint(access_bp, url_prefix='/api/access')

    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
    UPLOAD_FOLDER = os.path.normpath(UPLOAD_FOLDER)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(UPLOAD_FOLDER, filename)

    with app.app_context():
        db.create_all()

    return app