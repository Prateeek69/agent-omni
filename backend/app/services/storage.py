import os
import json

BASE_DATA_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../data")
)

# Ensure data directory exists
os.makedirs(BASE_DATA_DIR, exist_ok=True)


class StorageService:
    """
    Handles saving and loading job data.
    """

    def __init__(self):
        pass

    def save(self, job_id: str, payload: dict):
        file_path = os.path.join(BASE_DATA_DIR, f"{job_id}.json")

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def load(self, job_id: str):
        file_path = os.path.join(BASE_DATA_DIR, f"{job_id}.json")

        if not os.path.exists(file_path):
            return None

        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)