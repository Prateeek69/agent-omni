import os
import re


class Aggregator:
    """
    Aggregates outputs from all agents into a final structured response.
    """

    def aggregate(self, normalized_data: dict, results: dict, processing_meta: dict | None = None) -> dict:
        processing_meta = processing_meta or {}
        reasoning = results.get("reasoning", {})
        # judge = results.get("judge", {}) # We are moving logic here

        sources = []
        raw_chunks = []
        extraction_methods = []
        ocr_details = results.get("ocr", [])
        
        fallback_used = any(o.get("fallback_used", False) for o in ocr_details)
        avg_ocr_conf = 0
        if ocr_details:
            avg_ocr_conf = sum(o.get("ocr_confidence", 0) for o in ocr_details) / len(ocr_details)

        for item in normalized_data.get("inputs", []):
            source_path = item.get("source")
            source_name = os.path.basename(source_path) if source_path and source_path != "user" else "Pasted Text"
            sources.append({
                "type": item.get("type"),
                "source": source_path,
                "name": source_name,
            })
            if item.get("type") == "text" and item.get("content"):
                raw_chunks.append(item["content"].strip())

        for item in ocr_details:
            text = item.get("text", "").strip()
            if text:
                raw_chunks.append(text)
            method = item.get("method")
            if method and method not in extraction_methods:
                extraction_methods.append(method)

        for item in results.get("audio", []):
            transcript = item.get("transcript", "").strip()
            if transcript:
                raw_chunks.append(transcript)
            method = item.get("method") or "audio_transcription"
            if method and method not in extraction_methods:
                extraction_methods.append(method)

        raw_text = "\n\n".join(chunk for chunk in raw_chunks if chunk).strip()
        word_count = len(re.findall(r"\b\w+\b", raw_text))
        
        # New Confidence Scoring
        confidence_score, confidence_label = self._calculate_confidence(
            raw_text, 
            avg_ocr_conf, 
            extraction_methods, 
            fallback_used
        )

        primary_source = next((source for source in sources if source.get("source") != "user"), None)
        primary_input = normalized_data.get("inputs", [{}])[0] if normalized_data.get("inputs") else {}

        # Build structured timeline
        timeline = []
        agents_used = []

        if ocr_details:
            agents_used.append("OCR Agent")
            ocr_text = ""
            for o in ocr_details:
                if o.get("text"):
                    ocr_text += o["text"] + " "
            timeline.append({
                "agent": "OCR Agent",
                "status": "completed",
                "output_preview": (ocr_text[:150].strip() + "...") if len(ocr_text) > 150 else ocr_text.strip()
            })

        audio_details = results.get("audio", [])
        if audio_details:
            agents_used.append("Audio Agent")
            audio_text = ""
            for a in audio_details:
                if a.get("transcript"):
                    audio_text += a["transcript"] + " "
            timeline.append({
                "agent": "Audio Agent",
                "status": "completed",
                "output_preview": (audio_text[:150].strip() + "...") if len(audio_text) > 150 else audio_text.strip()
            })

        agents_used.append("Reasoning Agent")
        summary_text = reasoning.get("summary", "")
        timeline.append({
            "agent": "Reasoning Agent",
            "status": "completed",
            "output_preview": (summary_text[:150].strip() + "...") if len(summary_text) > 150 else summary_text.strip()
        })

        return {
            "final_answer": reasoning.get("answer", ""),
            "summary": reasoning.get("summary", ""),
            "key_points": reasoning.get("key_points", []),
            "actions": reasoning.get("suggested_actions", []),
            "sources": sources,
            "confidence": confidence_label,
            "confidence_score": confidence_score,
            "issues": [], # Can be populated based on score components
            "document_type": reasoning.get("document_type", ""),
            "important_entities": reasoning.get("important_entities", {}),
            "raw_extracted_text": raw_text,
            "primary_filename": primary_source.get("name") if primary_source else "Pasted Text",
            "primary_input_type": (primary_source or primary_input).get("type", "text"),
            "extraction_methods": extraction_methods,
            "processing_time_ms": processing_meta.get("processing_time_ms", 0),
            "processing_time_seconds": processing_meta.get("processing_time_seconds", 0.0),
            "word_count": word_count,
            "job_id": normalized_data.get("job_id", ""),
            "router": {
                "intent": reasoning.get("intent", "General Document Understanding"),
                "agents_used": agents_used
            },
            "agent_timeline": timeline
        }

    def _calculate_confidence(self, text, avg_ocr_conf, methods, fallback_used):
        if not text:
            return 0, "low"
            
        score = 0.0
        
        # 1. OCR Confidence (0.4 max)
        if "pdf_text" in methods or "text" in methods:
            score += 0.4 # Native text is high confidence
        else:
            score += (avg_ocr_conf / 100.0) * 0.4
            
        # 2. Word Count (0.2 max)
        word_count = len(re.findall(r"\b\w+\b", text))
        if word_count > 50:
            score += 0.2
        elif word_count > 10:
            score += 0.1
            
        # 3. Valid Word Ratio (0.2 max)
        # Check percentage of words that look like actual words (alnum)
        words = text.split()
        if words:
            valid_words = [w for w in words if any(c.isalpha() for c in w)]
            valid_ratio = len(valid_words) / len(words)
            score += valid_ratio * 0.2
            
        # 4. Low Noise (0.2 max)
        weird_chars = len(re.findall(r"[^\w\s.,!?;:-]", text))
        noise_ratio = weird_chars / len(text) if text else 1
        if noise_ratio < 0.05:
            score += 0.2
        elif noise_ratio < 0.15:
            score += 0.1
            
        # Labeling
        label = "low"
        if score > 0.75:
            label = "high"
        elif score > 0.5:
            label = "medium"
            
        # Fallback cap
        if fallback_used and label == "high":
            label = "medium"
            
        return round(score, 2), label