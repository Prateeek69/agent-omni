class Aggregator:
    """
    Aggregates outputs from all agents into a final structured response.
    """

    def __init__(self):
        pass

    def aggregate(self, normalized_data: dict, results: dict) -> dict:

        reasoning = results.get("reasoning", {})
        judge = results.get("judge", {})

        # Collect sources
        sources = []
        for item in normalized_data.get("inputs", []):
            sources.append({
                "type": item.get("type"),
                "source": item.get("source")
            })

        return {
            "final_answer": reasoning.get("answer", ""),
            "summary": reasoning.get("summary", ""),
            "key_points": reasoning.get("key_points", []),
            "actions": reasoning.get("suggested_actions", []),
            "sources": sources,
            "confidence": judge.get("confidence", "unknown"),
            "issues": judge.get("issues", []),
            "document_type": reasoning.get("document_type", ""),
            "important_entities": reasoning.get("important_entities", {})
        }