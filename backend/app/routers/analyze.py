from fastapi import APIRouter, Query
import os

from app.services.normalizer import normalize_input
from app.agents.router_agent import route_request
from app.agents.ocr_agent import OCRAgent
from app.agents.audio_agent import AudioAgent
from app.agents.reasoning_agent import ReasoningAgent
from app.agents.judge_agent import JudgeAgent  
from app.services.aggregator import Aggregator
from app.services.storage import StorageService

# Absolute path to uploads directory
BASE_UPLOAD_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../uploads")
)

analyze_router = APIRouter()


@analyze_router.get("/")
def analyze(job_id: str = Query(...)):
    try:
        # Locate job folder
        job_path = os.path.join(BASE_UPLOAD_DIR, job_id)

        if not os.path.exists(job_path):
            print(f"ERROR: Job path not found: {job_path}")
            return {"error": "Invalid job_id"}

        # 1️⃣ Normalize inputs
        normalized_data = normalize_input(job_id, job_path)
        print(f"DEBUG: Normalized data: {normalized_data}")

        # 2️⃣ Decide which agents to run
        routing_decision = route_request(normalized_data)
        print(f"DEBUG: Routing decision: {routing_decision}")

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
                    
                    try:
                        extracted = ocr_agent.process(absolute_path)
                        ocr_results.append(extracted)
                        if extracted.get("text"):
                            combined_text_chunks.append(extracted["text"])
                    except Exception as e:
                        print(f"ERROR: OCR failed for {absolute_path}: {e}")
                        ocr_results.append({"text": "", "error": str(e)})

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
                    
                    try:
                        result = audio_agent.process(absolute_path)
                        audio_results.append(result)
                        if result.get("transcript"):
                            combined_text_chunks.append(result["transcript"])
                    except Exception as e:
                        print(f"ERROR: Audio failed for {absolute_path}: {e}")
                        audio_results.append({"transcript": "", "error": str(e)})

            results["audio"] = audio_results

        # 5️⃣ Include raw text input
        for item in normalized_data.get("inputs", []):
            if item["type"] == "text" and item.get("content"):
                combined_text_chunks.append(item["content"])

        if not combined_text_chunks:
            results["reasoning"] = {
                "summary": "",
                "key_points": [],
                "suggested_actions": [],
                "answer": "No valid input found.",
                "confidence": "low"
            }

        # 6️⃣ Run Reasoning Agent
        if "reasoning" in routing_decision["agents"]:
            reasoning_agent = ReasoningAgent()
            combined_text = "\n".join(combined_text_chunks)
            reasoning_result = reasoning_agent.process(combined_text)
            results["reasoning"] = reasoning_result

        # 7️⃣ Run Judge Agent
        judge_agent = JudgeAgent()
        judge_result = judge_agent.evaluate(results)
        results["judge"] = judge_result

        # Run Aggregator
        aggregator = Aggregator()
        final_output = aggregator.aggregate(normalized_data, results)
        
        # Save everything
        storage = StorageService()
        storage.save(job_id, {
            "normalized_data": normalized_data,
            "routing": routing_decision,
            "results": results,
            "final_output": final_output
        })
            
        return {
            "final_output": final_output,
            "debug": {
                "normalized_data": normalized_data,
                "routing": routing_decision,
                "results": results
            }
        }
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR: {e}")
        print(traceback.format_exc())
        return {"error": str(e), "detail": traceback.format_exc()}

@analyze_router.get("/history")
def get_history(job_id: str):
    storage = StorageService()
    data = storage.load(job_id)

    if not data:
        return {"error": "No data found"}

    return data