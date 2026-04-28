class JudgeAgent:
    """
    Judge Agent checks the quality and completeness of outputs.
    """

    def __init__(self):
        pass

    def evaluate(self, results: dict) -> dict:
        issues = []
        successful_agents = 0
        total_agents_run = 0

        # Check OCR
        if "ocr" in results and results["ocr"]:
            total_agents_run += 1
            ocr_texts = [item.get("text", "").strip() for item in results["ocr"]]
            # Filter out empty or very short snippets
            valid_ocr = [t for t in ocr_texts if len(t) > 20]
            
            if not valid_ocr:
                issues.append("OCR failed to extract significant text from images/PDFs.")
            else:
                successful_agents += 1
                if len(valid_ocr) < len(ocr_texts):
                    issues.append("Some documents had poor OCR quality.")

        # Check Audio
        if "audio" in results and results["audio"]:
            total_agents_run += 1
            transcripts = [item.get("transcript", "").strip() for item in results["audio"]]
            valid_audio = [t for t in transcripts if len(t) > 10]

            if not valid_audio:
                issues.append("Audio transcription returned no results.")
            else:
                successful_agents += 1

        # Check reasoning
        reasoning = results.get("reasoning", {})
        if reasoning:
            total_agents_run += 1
            summary = reasoning.get("summary", "").strip()
            
            if not summary:
                issues.append("Reasoning agent failed to generate a summary.")
            elif len(summary) < 30:
                issues.append("Reasoning summary is very short.")
            else:
                successful_agents += 1

        # Calculate Confidence
        if total_agents_run == 0:
            confidence = "low"
        else:
            success_ratio = successful_agents / total_agents_run
            if success_ratio >= 1.0 and len(issues) == 0:
                confidence = "high"
            elif success_ratio >= 0.5:
                confidence = "medium"
            else:
                confidence = "low"

        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "confidence": confidence,
            "metrics": {
                "successful_agents": successful_agents,
                "total_agents": total_agents_run
            }
        }