from fastapi import APIRouter, Query
import os

from app.services.normalizer import normalize_input
from app.agents.router_agent import route_request
from app.agents.ocr_agent import OCRAgent
from app.agents.audio_agent import AudioAgent
from app.agents.reasoning_agent import ReasoningAgent   # <-- NEW

# Absolute path to uploads directory
BASE_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../uploads")
)

analyze_router = APIRouter()


@analyze_router.get("/")
def analyze(job_id: str = Query(...)):
    # Locate job folder
    job_path = os.path.join(BASE_UPLOAD_DIR, job_id)

    if not os.path.exists(job_path):
        return {"error": "Invalid job_id"}

    # 1️⃣ Normalize inputs
    normalized_data = normalize_input(job_id, job_path)

    # 2️⃣ Decide which agents to run
    routing_decision = route_request(normalized_data)

    results = {}

    combined_text_chunks = []

    # 3️⃣ Run OCR if required
    if "ocr" in routing_decision["agents"]:
        ocr_agent = OCRAgent()
        ocr_results = []

        for item in normalized_data.get("inputs", []):
            if item["type"] in ["image", "pdf"]:

                absolute_path = os.path.join(
                    os.path.dirname(BASE_UPLOAD_DIR),
                    item["source"]
                )

                extracted = ocr_agent.process(absolute_path)
                ocr_results.append(extracted)

                # collect text for reasoning
                if extracted.get("text"):
                    combined_text_chunks.append(extracted["text"])

        results["ocr"] = ocr_results

    # 4️⃣ Run Audio Agent if required
    if "audio" in routing_decision["agents"]:
        audio_agent = AudioAgent()
        audio_results = []

        for item in normalized_data.get("inputs", []):
            if item["type"] == "audio":

                absolute_path = os.path.join(
                    os.path.dirname(BASE_UPLOAD_DIR),
                    item["source"]
                )

                result = audio_agent.process(absolute_path)
                audio_results.append(result)

                # collect transcript for reasoning
                if result.get("transcript"):
                    combined_text_chunks.append(result["transcript"])

        results["audio"] = audio_results

    # 5️⃣ Include raw text input (if any)
    for item in normalized_data.get("inputs", []):
        if item["type"] == "text" and item.get("content"):
            combined_text_chunks.append(item["content"])

    # 6️⃣ Run Reasoning Agent
    if "reasoning" in routing_decision["agents"]:
        reasoning_agent = ReasoningAgent()

        combined_text = "\n".join(combined_text_chunks)

        reasoning_result = reasoning_agent.process(combined_text)

        results["reasoning"] = reasoning_result

    # 7️⃣ Final combined response
    return {
        "normalized_data": normalized_data,
        "routing": routing_decision,
        "results": results
    }