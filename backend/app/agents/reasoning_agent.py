class ReasoningAgent:
    """
    Reasoning Agent responsible for understanding extracted content
    and producing a structured response.
    """

    def __init__(self):
        pass

    def process(self, combined_text: str) -> dict:
        """
        Takes all text (OCR + Audio + user text)
        and produces a structured reasoning output.
        """

        if not combined_text.strip():
            return {
                "summary": "",
                "key_points": [],
                "suggested_actions": [],
                "answer": "",
                "confidence": "low"
            }

        # Basic MVP logic (you can improve later)
        summary = combined_text[:300]

        return {
            "summary": summary,
            "key_points": self._extract_key_points(combined_text),
            "suggested_actions": self._suggest_actions(combined_text),
            "answer": "Based on the provided content, see summary and key points.",
            "confidence": "medium"
        }

    def _extract_key_points(self, text: str):
        sentences = text.split(".")
        return [s.strip() for s in sentences[:5] if s.strip()]

    def _suggest_actions(self, text: str):
        actions = []

        lowered = text.lower()

        if "pay" in lowered:
            actions.append("Consider making a payment.")
        if "deadline" in lowered or "due" in lowered:
            actions.append("Check deadlines.")
        if "document" in lowered or "submit" in lowered:
            actions.append("Prepare required documents.")

        if not actions:
            actions.append("Review the content carefully.")

        return actions