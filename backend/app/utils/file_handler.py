import os
import uuid
from fastapi import UploadFile

BASE_UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../uploads"))


def create_job_directory() -> str:
    job_id = str(uuid.uuid4())
    job_path = os.path.join(BASE_UPLOAD_DIR, job_id)

    os.makedirs(job_path, exist_ok=True)

    return job_id, job_path


def save_uploaded_file(file: UploadFile, job_path: str) -> str:
    file_path = os.path.join(job_path, file.filename)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    return file_path