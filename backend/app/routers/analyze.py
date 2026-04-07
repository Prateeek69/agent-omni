from fastapi import APIRouter, Query
import os

from app.services.normalizer import normalize_input

BASE_UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../uploads"))

analyze_router = APIRouter()


@analyze_router.get("/")
def analyze(job_id: str = Query(...)):
    job_path = os.path.join(BASE_UPLOAD_DIR, job_id)

    if not os.path.exists(job_path):
        return {"error": "Invalid job_id"}

    normalized_data = normalize_input(job_id, job_path)

    return {
        "message": "Normalization complete",
        "data": normalized_data
    }