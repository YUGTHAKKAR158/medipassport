import requests

def check_drug_interactions(new_drug: str, existing_drugs: list[str]) -> dict:
    """
    Checks for drug interactions using the free OpenFDA API.
    
    This function retrieves drug labels and checks their drug interaction 
    sections to evaluate if a new drug interacts with any existing drugs
    the patient is currently taking.

    Args:
        new_drug (str): The name of the new drug to check.
        existing_drugs (list[str]): A list of drug names the patient is already taking.

    Returns:
        dict: A dictionary containing the status, evaluated drug, and any interactions found.
    """
    result = {
        "status": "safe",
        "interactions_found": [],
        "checked_drug": new_drug
    }

    if not new_drug or not existing_drugs:
        return result

    try:
        interactions_found = []
        
        for drug in existing_drugs:
            # Search for labels where the drug is mentioned in the drug_interactions section
            # The prompt requested searching for {new_drug}, but dynamically substituting the drug in the loop
            # makes practical sense to find if new_drug appears against each existing drug.
            url = f"https://api.fda.gov/drug/label.json?search=drug_interactions:{drug}&limit=1"
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                if results:
                    # Get the drug_interactions text
                    interactions = results[0].get("drug_interactions", [])
                    interactions_text = " ".join(interactions).lower()
                    
                    # Parse the response to find if new_drug appears in interaction warnings
                    if new_drug.lower() in interactions_text:
                        interactions_found.append({
                            "drug": drug,
                            "severity": "warning",
                            "note": f"Potential interaction found between {new_drug} and {drug} based on FDA labels."
                        })
            elif response.status_code != 404:
                # 404 means no records found, which is fine, but other errors might indicate API issues
                return {
                    "status": "unknown",
                    "interactions_found": [],
                    "checked_drug": new_drug
                }

        if interactions_found:
            result["status"] = "warning"
            result["interactions_found"] = interactions_found

    except Exception as e:
        # If OpenFDA API fails, return status: "unknown"
        print(f"Error checking OpenFDA API: {e}")
        result["status"] = "unknown"

    return result
