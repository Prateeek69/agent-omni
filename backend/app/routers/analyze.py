from fastapi import APIRouter, Query
import os
from time import perf_counter

from app.services.normalizer import normalize_input
from app.agents.router_agent import route_request
from app.agents.ocr_agent import OCRAgent
from app.agents.audio_agent import AudioAgent
from app.agents.reasoning_agent import ReasoningAgent
from app.agents.judge_agent import JudgeAgent
from app.services.aggregator import Aggregator
from app.services.storage import StorageService

BASE_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../uploads")
)

analyze_router = APIRouter()


@analyze_router.get("/")
def analyze(job_id: str = Query(...)):
    started_at = perf_counter()

    try:
        job_path = os.path.join(BASE_UPLOAD_DIR, job_id)

        if not os.path.exists(job_path):
            return {"error": "Invalid job_id"}

        normalized_data = normalize_input(job_id, job_path)
        routing_decision = route_request(normalized_data)

        results = {}
        combined_text_chunks = []

        if "ocr" in routing_decision["agents"]:
            ocr_agent = OCRAgent()
            ocr_results = []

            for item in normalized_data.get("inputs", []):
                if item["type"] in ["image", "pdf"]:
                    absolute_path = os.path.join(
                        os.path.dirname(BASE_UPLOAD_DIR),
                        item["source"],
                    )

                    try:
                        extracted = ocr_agent.process(absolute_path)
                        ocr_results.append(extracted)
                        if extracted.get("text"):
                            combined_text_chunks.append(extracted["text"])
                    except Exception as exc:
                        ocr_results.append({
                            "text": "",
                            "error": str(exc),
                            "method": "failed",
                            "has_selectable_text": False,
                            "ocr_used": item["type"] == "pdf",
                            "text_quality": "low",
                        })

            results["ocr"] = ocr_results

        if "audio" in routing_decision["agents"]:
            audio_agent = AudioAgent()
            audio_results = []

            for item in normalized_data.get("inputs", []):
                if item["type"] == "audio":
                    absolute_path = os.path.join(
                        os.path.dirname(BASE_UPLOAD_DIR),
                        item["source"],
                    )

                    try:
                        result = audio_agent.process(absolute_path)
                        audio_results.append(result)
                        if result.get("transcript"):
                            combined_text_chunks.append(result["transcript"])
                    except Exception as exc:
                        audio_results.append({
                            "transcript": "",
                            "error": str(exc),
                            "method": "failed",
                        })

            results["audio"] = audio_results

        for item in normalized_data.get("inputs", []):
            if item["type"] == "text" and item.get("content"):
                combined_text_chunks.append(item["content"])

        if not combined_text_chunks:
            results["reasoning"] = {
                "document_type": "unknown",
                "summary": "",
                "key_points": [],
                "important_entities": {
                    "dates": [],
                    "organizations": [],
                    "names": [],
                },
                "suggested_actions": [],
                "answer": "No valid input found.",
                "summary_quality": "low",
                "confidence": "low",
            }
        elif "reasoning" in routing_decision["agents"]:
            reasoning_agent = ReasoningAgent()
            combined_text = "\n\n".join(chunk for chunk in combined_text_chunks if chunk)
            results["reasoning"] = reasoning_agent.process(combined_text)

        judge_agent = JudgeAgent()
        results["judge"] = judge_agent.evaluate(results)

        processing_time_ms = int((perf_counter() - started_at) * 1000)
        processing_meta = {
            "processing_time_ms": processing_time_ms,
            "processing_time_seconds": round(processing_time_ms / 1000, 1),
        }

        aggregator = Aggregator()
        final_output = aggregator.aggregate(normalized_data, results, processing_meta)

        storage = StorageService()
        storage.save(job_id, {
            "normalized_data": normalized_data,
            "routing": routing_decision,
            "results": results,
            "final_output": final_output,
        })

        return {
            "final_output": final_output,
            "debug": {
                "normalized_data": normalized_data,
                "routing": routing_decision,
                "results": results,
            },
        }
    except Exception as exc:
        import traceback
        return {"error": str(exc), "detail": traceback.format_exc()}


@analyze_router.get("/history")
def get_history(job_id: str):
    storage = StorageService()
    data = storage.load(job_id)

    if not data:
        return {"error": "No data found"}

    return data