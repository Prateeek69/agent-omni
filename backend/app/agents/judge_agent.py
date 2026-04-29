class JudgeAgent:
    """
    Judge Agent checks the quality and completeness of outputs.
    """

    def evaluate(self, results: dict) -> dict:
        issues = []
        successful_agents = 0.0
        total_agents_run = 0
        confidence_cap = "high"

        ocr_results = results.get("ocr", [])
        if ocr_results:
            total_agents_run += 1
            valid_documents = 0
            qualities = []

            for item in ocr_results:
                text = item.get("text", "").strip()
                quality = item.get("text_quality", "low")
                qualities.append(quality)
                if len(text) >= 40:
                    valid_documents += 1

                if item.get("ocr_used") and not item.get("has_selectable_text", False):
                    issues.append("At least one file required OCR fallback, which can reduce text quality.")

            if valid_documents == len(ocr_results):
                successful_agents += 1
            elif valid_documents > 0:
                successful_agents += 0.5
                issues.append("Some extracted documents are incomplete.")
            else:
                issues.append("Text extraction failed to capture significant content.")

            if "low" in qualities:
                confidence_cap = "low"
                issues.append("Extracted text is noisy and may contain OCR artifacts.")
            elif "medium" in qualities and confidence_cap != "low":
                confidence_cap = "medium"

        audio_results = results.get("audio", [])
        if audio_results:
            total_agents_run += 1
            transcripts = [item.get("transcript", "").strip() for item in audio_results]
            valid_audio = [text for text in transcripts if len(text) > 10]

            if not valid_audio:
                issues.append("Audio transcription returned no results.")
            elif len(valid_audio) == len(audio_results):
                successful_agents += 1
            else:
                successful_agents += 0.5
                confidence_cap = "medium" if confidence_cap == "high" else confidence_cap
                issues.append("Some audio transcripts are incomplete.")

        reasoning = results.get("reasoning", {})
        if reasoning:
            total_agents_run += 1
            summary = reasoning.get("summary", "").strip()
            summary_quality = reasoning.get("summary_quality", "low")

            if not summary:
                issues.append("Reasoning agent failed to generate a structured summary.")
            elif summary_quality == "high":
                successful_agents += 1
            elif summary_quality == "medium":
                successful_agents += 0.5
                confidence_cap = "medium" if confidence_cap == "high" else confidence_cap
                issues.append("Structured summary quality is moderate.")
            else:
                confidence_cap = "low"
                issues.append("Structured summary quality is low.")

        issues = list(dict.fromkeys(issues))

        if total_agents_run == 0:
            confidence = "low"
        else:
            success_ratio = successful_agents / total_agents_run
            if success_ratio >= 0.9 and not issues:
                confidence = "high"
            elif success_ratio >= 0.5:
                confidence = "medium"
            else:
                confidence = "low"

        if confidence_cap == "low":
            confidence = "low"
        elif confidence_cap == "medium" and confidence == "high":
            confidence = "medium"

        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "confidence": confidence,
            "metrics": {
                "successful_agents": successful_agents,
                "total_agents": total_agents_run,
            },
        }