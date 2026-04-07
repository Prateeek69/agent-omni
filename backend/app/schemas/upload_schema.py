from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    job_id: str
    file_name: Optional[str]
    file_type: Optional[str]
    text_input: Optional[str]
    status: str