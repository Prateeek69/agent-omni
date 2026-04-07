from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

from app.utils.file_handler import create_job_directory, save_uploaded_file
from app.schemas.upload_schema import UploadResponse

upload_router = APIRouter()


@upload_router.post("/", response_model=UploadResponse)
async def upload_file(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    job_id, job_path = create_job_directory()

    file_name = None
    file_type = None

    if file:
        file_path = save_uploaded_file(file, job_path)
        file_name = file.filename
        file_type = file.content_type

    return UploadResponse(
        job_id=job_id,
        file_name=file_name,
        file_type=file_type,
        text_input=text,
        status="uploaded"
    )