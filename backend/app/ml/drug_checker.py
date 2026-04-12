import requests

# Curated dangerous drug interactions from FDA safety communications
# Format: frozenset({drug_a, drug_b}): {severity, note}
KNOWN_INTERACTIONS = {
    frozenset({"simvastatin", "clarithromycin"}): {
        "severity": "dangerous",
        "note": "Clarithromycin inhibits CYP3A4, greatly increasing simvastatin levels. Risk of severe muscle toxicity (rhabdomyolysis). FDA contraindicated."
    },
    frozenset({"simvastatin", "erythromycin"}): {
        "severity": "dangerous",
        "note": "Erythromycin inhibits CYP3A4, increasing simvastatin exposure. Risk of myopathy and rhabdomyolysis."
    },
    frozenset({"simvastatin", "amiodarone"}): {
        "severity": "dangerous",
        "note": "Combination increases risk of myopathy. FDA recommends simvastatin dose not exceed 20mg with amiodarone."
    },
    frozenset({"warfarin", "aspirin"}): {
        "severity": "dangerous",
        "note": "Both increase bleeding risk. Combination significantly raises risk of serious haemorrhage. Avoid unless explicitly indicated."
    },
    frozenset({"warfarin", "ibuprofen"}): {
        "severity": "dangerous",
        "note": "NSAIDs increase anticoagulant effect of warfarin and cause GI bleeding risk."
    },
    frozenset({"warfarin", "naproxen"}): {
        "severity": "dangerous",
        "note": "NSAIDs potentiate warfarin anticoagulation. High risk of bleeding."
    },
    frozenset({"metformin", "alcohol"}): {
        "severity": "warning",
        "note": "Alcohol increases risk of lactic acidosis with metformin. Advise patient to avoid alcohol."
    },
    frozenset({"levocetirizine", "diphenhydramine"}): {
        "severity": "warning",
        "note": "Both are antihistamines. Combining causes excessive sedation and CNS depression."
    },
    frozenset({"cetirizine", "diphenhydramine"}): {
        "severity": "warning",
        "note": "Duplicate antihistamine therapy. Excessive sedation risk."
    },
    frozenset({"lisinopril", "potassium"}): {
        "severity": "warning",
        "note": "ACE inhibitors can cause hyperkalaemia. Potassium supplementation may worsen this."
    },
    frozenset({"ciprofloxacin", "antacid"}): {
        "severity": "warning",
        "note": "Antacids reduce absorption of ciprofloxacin significantly. Separate administration by 2 hours."
    },
    frozenset({"ssri", "tramadol"}): {
        "severity": "dangerous",
        "note": "Risk of serotonin syndrome. Potentially life-threatening combination."
    },
    frozenset({"fluoxetine", "tramadol"}): {
        "severity": "dangerous",
        "note": "Risk of serotonin syndrome. Potentially life-threatening."
    },
    frozenset({"sertraline", "tramadol"}): {
        "severity": "dangerous",
        "note": "Risk of serotonin syndrome. Potentially life-threatening."
    },
    frozenset({"methotrexate", "ibuprofen"}): {
        "severity": "dangerous",
        "note": "NSAIDs reduce methotrexate clearance, increasing toxicity risk severely."
    },
    frozenset({"methotrexate", "naproxen"}): {
        "severity": "dangerous",
        "note": "NSAIDs reduce methotrexate clearance. High toxicity risk."
    },
    frozenset({"digoxin", "amiodarone"}): {
        "severity": "dangerous",
        "note": "Amiodarone increases digoxin levels by 50-100%. Risk of digoxin toxicity."
    },
    frozenset({"clopidogrel", "omeprazole"}): {
        "severity": "warning",
        "note": "Omeprazole reduces antiplatelet effect of clopidogrel. Consider alternative PPI."
    },
    frozenset({"sildenafil", "nitrate"}): {
        "severity": "dangerous",
        "note": "Severe hypotension risk. Absolutely contraindicated combination."
    },
    frozenset({"lithium", "ibuprofen"}): {
        "severity": "dangerous",
        "note": "NSAIDs reduce lithium excretion, causing lithium toxicity."
    },
    frozenset({"phenytoin", "warfarin"}): {
        "severity": "warning",
        "note": "Complex interaction — can both increase and decrease warfarin effect. Close monitoring required."
    },
}


def normalize(drug_name: str) -> str:
    """Normalize drug name for comparison."""
    return drug_name.lower().strip()


def check_drug_interactions(new_drug: str, existing_drugs: list) -> dict:
    """
    Check for drug interactions using curated FDA safety database.
    Falls back to OpenFDA API for drugs not in local database.
    
    Args:
        new_drug: The new drug being prescribed
        existing_drugs: List of existing drug names from patient records
        
    Returns:
        dict with status, interactions_found, checked_drug
    """
    result = {
        "status": "safe",
        "interactions_found": [],
        "checked_drug": new_drug
    }

    if not new_drug or not existing_drugs:
        return result

    new_drug_norm = normalize(new_drug)
    interactions_found = []

    # Step 1: Check local curated database first
    for existing_drug in existing_drugs:
        existing_norm = normalize(existing_drug)
        pair = frozenset({new_drug_norm, existing_norm})
        
        if pair in KNOWN_INTERACTIONS:
            interaction = KNOWN_INTERACTIONS[pair]
            interactions_found.append({
                "drug": existing_drug,
                "severity": interaction["severity"],
                "note": interaction["note"]
            })

    # Step 2: If found in local DB, return immediately
    if interactions_found:
        has_dangerous = any(i["severity"] == "dangerous" for i in interactions_found)
        result["status"] = "dangerous" if has_dangerous else "warning"
        result["interactions_found"] = interactions_found
        return result

    # Step 3: Try OpenFDA API as fallback for unknown pairs
    try:
        search_url = f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:\"{new_drug_norm}\"&limit=1"
        response = requests.get(search_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            if results:
                label = results[0]
                interaction_text = ""
                for field in ["drug_interactions", "warnings", "warnings_and_cautions"]:
                    if field in label:
                        interaction_text = " ".join(label[field]).lower()
                        break
                
                if interaction_text:
                    for existing_drug in existing_drugs:
                        if normalize(existing_drug) in interaction_text:
                            interactions_found.append({
                                "drug": existing_drug,
                                "severity": "warning",
                                "note": f"FDA label for {new_drug.title()} mentions {existing_drug.title()} in interaction warnings. Verify with pharmacist."
                            })
                    
                    if interactions_found:
                        result["status"] = "warning"
                        result["interactions_found"] = interactions_found
                        return result

    except Exception as e:
        print(f"OpenFDA fallback error: {e}")

    # Step 4: No interactions found in either source
    result["status"] = "safe"
    return result
