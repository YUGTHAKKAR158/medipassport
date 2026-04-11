from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..ml.drug_checker import check_drug_interactions

ml_bp = Blueprint('ml_bp', __name__)

@ml_bp.route('/check-interactions', methods=['POST'])
@jwt_required()
def check_interactions():
    """
    Check for potential interactions between a new drug and existing drugs.
    Requires JWT authentication.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
        
    new_drug = data.get("new_drug")
    existing_drugs = data.get("existing_drugs")
    
    if not new_drug or not isinstance(new_drug, str):
        return jsonify({"error": "Missing or invalid 'new_drug' parameter"}), 400
        
    if not isinstance(existing_drugs, list):
        return jsonify({"error": "Missing or invalid 'existing_drugs' parameter. Must be a list."}), 400

    try:
        result = check_drug_interactions(new_drug, existing_drugs)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "An error occurred during interactioin check", "details": str(e)}), 500
