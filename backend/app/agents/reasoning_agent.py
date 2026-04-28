from app.utils.text_cleaner import clean_text
import re

class ReasoningAgent:

    def process(self, combined_text: str) -> dict:

        cleaned_text = clean_text(combined_text)

        if not cleaned_text:
            return {
                "document_type": "unknown",
                "summary": "",
                "key_points": [],
                "important_entities": {
                    "dates": [],
                    "organizations": [],
                    "names": []
                },
                "suggested_actions": [],
                "answer": "",
                "confidence": "low"
            }

        document_type = self._detect_document_type(cleaned_text)
        meaningful_sentences = self._get_meaningful_sentences(cleaned_text)

        summary = self._generate_summary(meaningful_sentences)
        key_points = self._extract_key_points(meaningful_sentences)
        important_entities = self._extract_entities(cleaned_text)
        suggested_actions = self._suggest_actions(cleaned_text)

        return {
            "document_type": document_type,
            "summary": summary,
            "key_points": key_points,
            "important_entities": important_entities,
            "suggested_actions": suggested_actions,
            "answer": summary,
            "confidence": "medium"
        }

    def _detect_document_type(self, text: str) -> str:
        text_lower = text.lower()
        if "hall ticket" in text_lower:
            return "exam document"
        elif "invoice" in text_lower or "amount" in text_lower:
            return "bill"
        elif "internship" in text_lower:
            return "notice"
        return "general document"

    def _extract_entities(self, text: str) -> dict:
        entities = {
            "dates": [],
            "organizations": [],
            "names": []
        }
        
        # 1. Dates (dd/mm/yyyy, dd-mm-yyyy, Month DD, YYYY)
        date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b|\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4})\b'
        date_matches = re.finditer(date_pattern, text, re.IGNORECASE)
        for match in date_matches:
            match_str = match.group(0).strip()
            if match_str not in entities["dates"]:
                entities["dates"].append(match_str)
        # Limit to 3 dates
        entities["dates"] = entities["dates"][:3]

        # 2. Organizations (capitalized multi-word phrases, very basic heuristic)
        org_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
        for match in re.finditer(org_pattern, text):
            org = match.group(0).strip()
            # Ignore common false positives or titles that are Names
            if org not in entities["organizations"] and len(org.split()) >= 2 and not any(title in org for title in ["Mr ", "Ms ", "Dr ", "Prof "]):
                entities["organizations"].append(org)
        entities["organizations"] = entities["organizations"][:3]

        # 3. Names (Mr/Ms/Dr/Prof followed by names)
        name_pattern = r'\b(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Mr|Ms|Mrs|Dr|Prof)\s+[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b'
        for match in re.finditer(name_pattern, text):
            name = match.group(0).strip()
            if name not in entities["names"]:
                entities["names"].append(name)
        entities["names"] = entities["names"][:3]

        return entities

    def _get_meaningful_sentences(self, text: str) -> list:
        raw_sentences = re.split(r'(?<=[.!?]) +|\n', text)
        clean_sentences = []

        for s in raw_sentences:
            s_clean = s.strip()
            if len(s_clean) < 20: 
                continue
                
            alpha_count = sum(c.isalpha() for c in s_clean)
            if alpha_count < len(s_clean) * 0.4:
                continue

            words = [w for w in s_clean.split() if any(c.isalpha() for c in w)]
            if len(words) < 4:
                continue
                
            clean_sentences.append(s_clean)
            
        seen = set()
        deduped_sentences = []
        for s in clean_sentences:
            # normalize for duplication check
            normalized = " ".join(s.lower().split())
            if normalized not in seen:
                seen.add(normalized)
                deduped_sentences.append(s)

        return deduped_sentences

    def _generate_summary(self, sentences: list) -> str:
        if not sentences:
            return ""
        
        # Sort sentences by length as a proxy for detail/"meaningfulness" instead of just first lines
        sorted_by_length = sorted(sentences, key=lambda x: len(x), reverse=True)
        # Select best 2-3 clean sentences
        best_sentences = sorted_by_length[:3]
        
        # Restore chronological order if desired, or just join them
        best_sentences_in_order = [s for s in sentences if s in best_sentences]
        return " ".join(best_sentences_in_order).strip()

    def _extract_key_points(self, sentences: list) -> list:
        if not sentences:
            return []
            
        key_points = []
        for s in sentences:
            if len(key_points) >= 5:
                break
            
            if s.endswith(','):
                continue
                
            key_points.append(s)

        return key_points

    def _suggest_actions(self, text: str):
        text = text.lower()
        actions = []

        if "apply" in text:
            actions.append("Apply before deadline.")
        if "deadline" in text or "last date" in text:
            actions.append("Note important deadlines.")
        if "submit" in text:
            actions.append("Prepare and submit required documents.")
        if "payment" in text or "fee" in text or "amount" in text:
            actions.append("Check payment requirements.")

        if not actions:
            actions.append("Review the document carefully.")
            
        # Deduplicate
        return list(dict.fromkeys(actions))