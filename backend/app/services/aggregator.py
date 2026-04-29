import os
import re


class Aggregator:
    """
    Aggregates outputs from all agents into a final structured response.
    """

    def aggregate(self, normalized_data: dict, results: dict, processing_meta: dict | None = None) -> dict:
        processing_meta = processing_meta or {}
        reasoning = results.get("reasoning", {})
        judge = results.get("judge", {})

        sources = []
        raw_chunks = []
        extraction_methods = []

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

        for item in results.get("ocr", []):
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

        primary_source = next((source for source in sources if source.get("source") != "user"), None)
        primary_input = normalized_data.get("inputs", [{}])[0] if normalized_data.get("inputs") else {}

        return {
            "final_answer": reasoning.get("answer", ""),
            "summary": reasoning.get("summary", ""),
            "key_points": reasoning.get("key_points", []),
            "actions": reasoning.get("suggested_actions", []),
            "sources": sources,
            "confidence": judge.get("confidence", "unknown"),
            "issues": judge.get("issues", []),
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
        }