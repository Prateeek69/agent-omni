import os


def detect_file_type(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()

    if ext in [".jpg", ".jpeg", ".png"]:
        return "image"
    elif ext in [".pdf"]:
        return "pdf"
    elif ext in [".mp3", ".wav"]:
        return "audio"
    else:
        return "unknown"


def normalize_input(job_id: str, job_path: str, text_input: str = None):
    normalized_data = {
        "job_id": job_id,
        "inputs": []
    }

    if os.path.exists(job_path):
        for file_name in os.listdir(job_path):
            file_path = os.path.join(job_path, file_name)
            file_type = detect_file_type(file_path)

            relative_path = os.path.join("uploads", job_id, file_name)

            normalized_data["inputs"].append({
                "type": file_type,
                "content": None,
                "source": relative_path
            })

    if text_input:
        normalized_data["inputs"].append({
            "type": "text",
            "content": text_input,
            "source": "user"
        })

    return normalized_data