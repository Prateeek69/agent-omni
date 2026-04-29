from collections import Counter
import re

from app.utils.text_cleaner import clean_text


class ReasoningAgent:
    _NOISE_PATTERNS = [
        re.compile(r"^(print|exit)$", re.IGNORECASE),
        re.compile(r"^page\s+\d+(?:\s+of\s+\d+)?$", re.IGNORECASE),
        re.compile(r"^scanned with .*$", re.IGNORECASE),
    ]

    _DATE_PATTERN = re.compile(
        r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b"
        r"|\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
        r"[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})\b",
        re.IGNORECASE,
    )

    _SECTION_PREFIXES = [
        "education",
        "experience",
        "projects",
        "achievements",
        "certifications",
        "skills",
    ]

    def process(self, combined_text: str) -> dict:
        cleaned_text = clean_text(combined_text, preserve_line_breaks=True)

        if not cleaned_text:
            return {
                "document_type": "unknown",
                "summary": "",
                "key_points": [],
                "important_entities": {
                    "dates": [],
                    "organizations": [],
                    "names": [],
                },
                "suggested_actions": [],
                "answer": "",
                "summary_quality": "low",
                "confidence": "low",
                "insights": {
                    "tone": "neutral",
                    "usefulness_score": 0,
                    "suggested_next_step": "Provide more content",
                }
            }

        document_type = self._detect_document_type(cleaned_text)
        prepared_lines = self._prepare_lines(cleaned_text)
        ranked_sentences = self._rank_sentences(prepared_lines, document_type)

        summary = self._generate_summary(prepared_lines, ranked_sentences, document_type)
        key_points = self._extract_key_points(prepared_lines, ranked_sentences, document_type)
        important_entities = self._extract_entities(prepared_lines, cleaned_text, document_type)
        suggested_actions = self._suggest_actions(document_type)
        confidence = self._estimate_confidence(summary, ranked_sentences, document_type)
        summary_quality = "high" if confidence == "high" else "medium" if summary else "low"
        
        # New insights
        tone = self._detect_tone(cleaned_text)
        usefulness_score = self._calculate_usefulness(summary, key_points, confidence)
        suggested_next_step = suggested_actions[0] if suggested_actions else "Review manually"

        return {
            "document_type": document_type,
            "summary": summary,
            "key_points": key_points,
            "important_entities": important_entities,
            "suggested_actions": suggested_actions,
            "answer": summary,
            "summary_quality": summary_quality,
            "confidence": confidence,
            "insights": {
                "tone": tone,
                "usefulness_score": usefulness_score,
                "suggested_next_step": suggested_next_step,
            }
        }

    def _detect_document_type(self, text: str) -> str:
        lower = text.lower()

        if any(keyword in lower for keyword in ["resume", "curriculum vitae", "linkedin", "github", "skills", "projects", "experience"]):
            return "resume"

        if any(keyword in lower for keyword in ["sgpa", "cgpa", "hall ticket", "semester", "result", "transcript", "certificate", "grade", "registration no"]):
            return "academic document"

        if "faq" in lower or "frequently asked" in lower:
            return "faq"

        if any(keyword in lower for keyword in ["notice", "application", "deadline", "eligible", "internship", "programme", "program"]):
            return "notice"

        if any(keyword in lower for keyword in ["invoice", "amount", "payment", "fee"]):
            return "bill"

        return "general pdf"

    def _prepare_lines(self, text: str) -> list[str]:
        raw_lines = [self._clean_line(line) for line in text.split("\n")]
        raw_lines = [line for line in raw_lines if line]

        merged_lines = []
        index = 0
        while index < len(raw_lines):
            current_line = raw_lines[index]
            next_line = raw_lines[index + 1] if index + 1 < len(raw_lines) else ""

            if current_line.endswith(":") and next_line and not next_line.endswith(":") and len(next_line) <= 120:
                merged_lines.append(self._clean_sentence(f"{current_line} {next_line}"))
                index += 2
                continue

            if merged_lines and self._should_merge_lines(merged_lines[-1], current_line):
                merged_lines[-1] = self._clean_sentence(f"{merged_lines[-1]} {current_line}")
                index += 1
                continue

            merged_lines.append(current_line)
            index += 1

        normalized_counts = Counter(self._normalize(line) for line in merged_lines)
        prepared_lines = []
        seen = set()

        for line in merged_lines:
            normalized = self._normalize(line)
            if not normalized or normalized in seen:
                continue

            if normalized_counts[normalized] > 1 and self._looks_like_header_footer(line):
                continue

            if self._is_noise_line(line):
                continue

            seen.add(normalized)
            prepared_lines.append(line)

        return prepared_lines

    def _rank_sentences(self, lines: list[str], document_type: str) -> list[dict]:
        candidates = self._build_candidate_sentences(lines)
        ranked = []
        seen = set()

        for index, candidate in enumerate(candidates):
            cleaned = self._clean_sentence(candidate)
            normalized = self._normalize(cleaned)
            if not normalized or normalized in seen:
                continue

            if self._is_low_value_sentence(cleaned):
                continue

            seen.add(normalized)
            ranked.append({
                "text": cleaned,
                "score": self._score_sentence(cleaned, document_type),
                "index": index,
            })

        ranked.sort(key=lambda item: (-item["score"], item["index"]))
        return ranked

    def _build_candidate_sentences(self, lines: list[str]) -> list[str]:
        chunks = []
        buffer = []

        for line in lines:
            if buffer and self._starts_new_section(line):
                chunks.append(" ".join(buffer))
                buffer = [line]
            else:
                buffer.append(line)

            joined = " ".join(buffer)
            if line.endswith((".", "!", "?")) or len(joined) >= 180 or len(buffer) >= 3:
                chunks.append(joined)
                buffer = []

        if buffer:
            chunks.append(" ".join(buffer))

        sentences = []
        for chunk in chunks:
            for part in re.split(r"(?<=[.!?])\s+", chunk):
                cleaned = self._clean_sentence(part)
                if cleaned:
                    sentences.append(cleaned)

        return sentences

    def _generate_summary(self, lines: list[str], ranked_sentences: list[dict], document_type: str) -> str:
        if document_type == "resume":
            summary = self._summarize_resume(lines)
            if summary:
                return summary

        if document_type == "academic document":
            summary = self._summarize_academic_document(lines)
            if summary:
                return summary

        if document_type == "faq":
            summary = self._summarize_faq(lines)
            if summary:
                return summary

        if document_type == "notice":
            summary = self._summarize_notice(lines)
            if summary:
                return summary

        return self._summarize_generic(ranked_sentences)

    def _summarize_resume(self, lines: list[str]) -> str:
        person_name = self._find_name_candidate(lines)
        institution = self._find_institution(lines)
        degree = self._find_degree(lines)
        cgpa_value = self._extract_numeric_metric(lines, ["cgpa", "gpa"])
        highlights = self._collect_highlights(
            lines,
            ["internship", "scholarship", "amazon", "award", "summer school", "research", "project", "achievement", "ibm"],
            limit=2,
        )

        sentences = []
        intro_subject = person_name or "The candidate"
        intro = intro_subject
        if degree:
            intro += f" is pursuing {degree}"
        if institution:
            intro += f" at {institution}"
        if cgpa_value:
            intro += f" with a CGPA of {cgpa_value}"
        if intro != intro_subject:
            sentences.append(self._ensure_sentence(intro))

        if highlights:
            highlight_text = self._join_phrases([self._strip_label_text(item) for item in highlights])
            sentences.append(self._ensure_sentence(f"Notable highlights include {highlight_text}"))

        return " ".join(sentences[:2]).strip()

    def _summarize_academic_document(self, lines: list[str]) -> str:
        institution = self._find_institution(lines)
        student_name = self._extract_labeled_value(lines, ["student name", "name"]) or self._find_name_candidate(lines)
        branch = self._extract_labeled_value(lines, ["branch", "department", "programme", "program"])
        reg_no = self._extract_labeled_value(lines, ["registration no", "roll no", "roll number"])
        sgpa_value = self._extract_numeric_metric(lines, ["sgpa", "cgpa", "percentage", "grade"])
        published_on = self._extract_labeled_value(lines, ["published on", "date", "exam date"])
        title = self._first_matching_line(lines, ["result", "hall ticket", "transcript", "certificate"])

        sentences = []
        if title:
            head = title
            if reg_no:
                head = f"{head} Registration No: {reg_no}"
            sentences.append(self._ensure_sentence(head))

        identity_parts = []
        if student_name:
            identity_parts.append(f"Student name: {student_name}")
        if branch:
            identity_parts.append(f"Branch: {branch}")
        if institution:
            identity_parts.append(f"Institution: {institution}")
        if identity_parts:
            sentences.append(self._ensure_sentence(" ".join(identity_parts)))

        detail_parts = []
        if sgpa_value:
            detail_parts.append(f"Score: {sgpa_value}")
        if published_on:
            detail_parts.append(f"Date: {published_on}")
        if detail_parts:
            sentences.append(self._ensure_sentence(" ".join(detail_parts)))

        return " ".join(sentences[:3]).strip()

    def _summarize_faq(self, lines: list[str]) -> str:
        title = self._first_matching_line(lines, ["faq"])
        question_lines = [line for line in lines if line.endswith("?") or re.match(r"^\d+\.\s+", line)]
        topics = []
        for line in question_lines:
            topic = self._topic_from_question(line)
            if topic and topic not in topics:
                topics.append(topic)
            if len(topics) >= 3:
                break

        sentences = []
        if title:
            sentences.append(self._ensure_sentence(title))
        if topics:
            sentences.append(self._ensure_sentence(f"It covers {self._join_phrases(topics)}"))

        return " ".join(sentences[:2]).strip()

    def _summarize_notice(self, lines: list[str]) -> str:
        title = self._first_matching_line(lines, ["notice", "internship", "programme", "program"])
        eligibility = self._first_matching_line(lines, ["eligible", "students", "registered", "enrolled"])
        deadline = self._first_matching_line(lines, ["deadline", "last date", "date", "commence"])

        sentences = []
        if title:
            sentences.append(self._ensure_sentence(title))
        if eligibility:
            sentences.append(self._ensure_sentence(self._strip_label_text(eligibility)))
        if deadline:
            sentences.append(self._ensure_sentence(self._strip_label_text(deadline)))

        return " ".join(sentences[:3]).strip()

    def _summarize_generic(self, ranked_sentences: list[dict]) -> str:
        if not ranked_sentences:
            return ""

        selected = []
        for item in ranked_sentences:
            if len(selected) >= 3:
                break
            if any(self._sentence_overlap(item["text"], existing["text"]) >= 0.7 for existing in selected):
                continue
            selected.append(item)

        selected.sort(key=lambda item: item["index"])
        return " ".join(self._ensure_sentence(item["text"]) for item in selected).strip()

    def _extract_key_points(self, lines: list[str], ranked_sentences: list[dict], document_type: str) -> list[str]:
        if document_type == "resume":
            points = []
            for line in lines:
                lower = line.lower()
                if any(keyword in lower for keyword in ["cgpa", "internship", "scholarship", "summer school", "project", "amazon", "ibm"]):
                    points.append(self._strip_label_text(line))
                if len(points) >= 5:
                    break
            if points:
                return list(dict.fromkeys(points))[:5]

        if document_type == "academic document":
            point_candidates = []
            mappings = [
                ("Student Name", ["student name", "name"]),
                ("Branch", ["branch", "department", "programme", "program"]),
                ("Registration No", ["registration no", "roll no", "roll number"]),
                ("Score", ["sgpa", "cgpa", "percentage", "grade"]),
                ("Published On", ["published on", "date", "exam date"]),
            ]
            for title, labels in mappings:
                if title == "Score":
                    value = self._extract_numeric_metric(lines, labels)
                else:
                    value = self._extract_labeled_value(lines, labels)
                if value:
                    point_candidates.append(f"{title}: {value}")
            if point_candidates:
                return point_candidates[:5]

        return [item["text"] for item in sorted(ranked_sentences[:5], key=lambda item: item["index"])]

    def _extract_entities(self, lines: list[str], text: str, document_type: str) -> dict:
        entities = {
            "dates": [],
            "organizations": [],
            "names": [],
        }

        for match in self._DATE_PATTERN.finditer(text):
            value = match.group(0).strip()
            if value and value not in entities["dates"]:
                entities["dates"].append(value)
        entities["dates"] = entities["dates"][:3]

        institution = self._find_institution(lines)
        if institution:
            entities["organizations"].append(institution)

        if document_type == "resume":
            for line in lines:
                if any(company in line.lower() for company in ["amazon", "google", "microsoft", "meta", "ibm"]):
                    entities["organizations"].append(self._strip_label_text(line))
                    break

        entities["organizations"] = list(dict.fromkeys(entities["organizations"]))[:3]

        name = self._find_name_candidate(lines)
        if name:
            entities["names"].append(name)

        return entities

    def _suggest_actions(self, document_type: str) -> list[str]:
        if document_type == "resume":
            return [
                "ATS Compatibility Review",
                "Improve Resume Impact",
                "Create Tailored Cover Letter",
                "Refine Wording",
                "Generate Resume Bullets"
            ]

        if document_type == "academic document":
            return [
                "Extract CGPA/Percentage",
                "Academic Summary",
                "Resume Bullet Points",
                "Highlight Achievements",
                "Organize Score Snapshot"
            ]

        if document_type == "notice":
            return [
                "Find Deadlines",
                "Identify Key Dates",
                "Check Eligibility",
                "Generate Action Items"
            ]

        if document_type == "bill":
            return [
                "Total Amount Extraction",
                "Vendor Details",
                "Export CSV",
                "Payment Timeline"
            ]

        return [
            "Summarize in 3 bullets",
            "Extract all dates",
            "Rewrite professionally",
            "List action items"
        ]

    def _detect_tone(self, text: str) -> str:
        lower = text.lower()
        if any(word in lower for word in ["urgent", "immediately", "deadline", "must", "warning"]):
            return "urgent / formal"
        if any(word in lower for word in ["please", "kindly", "thanks", "regards", "welcome"]):
            return "polite / professional"
        if any(word in lower for word in ["we", "our", "team", "together", "community"]):
            return "collaborative"
        if any(word in lower for word in ["innovation", "dynamic", "achieved", "lead", "optimized"]):
            return "achievement-oriented"
        return "neutral / informative"

    def _calculate_usefulness(self, summary: str, key_points: list[str], confidence: str) -> int:
        score = 0
        if confidence == "high": score += 4
        elif confidence == "medium": score += 2
        
        if len(summary.split()) > 30: score += 3
        elif len(summary.split()) > 10: score += 1
        
        if len(key_points) >= 3: score += 3
        elif len(key_points) > 0: score += 1
        
        return min(score, 10)

    def _estimate_confidence(self, summary: str, ranked_sentences: list[dict], document_type: str) -> str:
        if not summary:
            return "low"

        if document_type in {"resume", "academic document"} and len(summary.split()) >= 14:
            return "high"

        if not ranked_sentences:
            return "medium" if len(summary.split()) >= 10 else "low"

        top_scores = [item["score"] for item in ranked_sentences[:3]]
        average_score = sum(top_scores) / len(top_scores)

        if average_score >= 10 and len(summary.split()) >= 12:
            return "high"
        if average_score >= 6:
            return "medium"
        return "low"

    def _clean_line(self, line: str) -> str:
        line = re.sub(r"\s+", " ", line).strip()
        line = re.sub(r"[Ã¢â‚¬Â¢Ã‚Â·Ã¢â€“Âª]+", " ", line)
        line = re.sub(r"[|Ã‚Â¦]+", " | ", line)
        line = re.sub(r"\s+([,.;:!?])", r"\1", line)
        line = re.sub(r"([,.;:!?])(\w)", r"\1 \2", line)
        line = re.sub(r"(\d)\.\s+(\d)", r"\1.\2", line)
        line = re.sub(r"\s{2,}", " ", line)
        return line.strip(" -")

    def _clean_sentence(self, text: str) -> str:
        sentence = self._clean_line(text)
        sentence = re.sub(r"\s*\|\s*", "; ", sentence)
        sentence = re.sub(r";\s*;", ";", sentence)
        sentence = re.sub(r",\s*,", ",", sentence)
        sentence = re.sub(r"\s{2,}", " ", sentence)
        sentence = sentence.replace(" ,", ",").replace(" .", ".")
        sentence = sentence.replace(" ;", ";").replace(" :", ":")
        sentence = re.sub(r"\b([A-Za-z])\s+([A-Za-z])\b", r"\1 \2", sentence)
        return sentence.strip(" -")

    def _normalize(self, text: str) -> str:
        return re.sub(r"\s+", " ", text).strip().lower()

    def _should_merge_lines(self, previous_line: str, current_line: str) -> bool:
        if previous_line.endswith((":", ",", "-", "/")):
            return True
        if current_line[:1].islower() and not previous_line.endswith((".", "!", "?")):
            return True
        if len(previous_line.split()) <= 4 and len(current_line.split()) <= 8:
            return True
        return False

    def _looks_like_header_footer(self, line: str) -> bool:
        normalized = self._normalize(line)
        return any(pattern.match(line) for pattern in self._NOISE_PATTERNS) or normalized.startswith("page ")

    def _is_noise_line(self, line: str) -> bool:
        if any(pattern.match(line) for pattern in self._NOISE_PATTERNS):
            return True

        alpha_count = sum(char.isalpha() for char in line)
        total_count = len(line)
        symbol_ratio = sum(not char.isalnum() and not char.isspace() for char in line) / max(total_count, 1)

        if total_count < 3:
            return True
        if alpha_count == 0 and not re.search(r"\d", line):
            return True
        if symbol_ratio > 0.38 and "http" not in line.lower():
            return True
        return False

    def _is_low_value_sentence(self, sentence: str) -> bool:
        words = re.findall(r"\b[\w/-]+\b", sentence)
        alpha_chars = sum(char.isalpha() for char in sentence)
        alpha_ratio = alpha_chars / max(len(sentence), 1)

        if len(sentence) > 260:
            return True
        if len(words) < 4 and ":" not in sentence:
            return True
        if alpha_ratio < 0.45 and "http" not in sentence.lower() and ":" not in sentence:
            return True
        return False

    def _score_sentence(self, sentence: str, document_type: str) -> int:
        words = re.findall(r"\b[\w/-]+\b", sentence)
        word_count = len(words)
        lower = sentence.lower()
        score = 0

        if 6 <= word_count <= 28:
            score += 6
        else:
            score += max(0, 6 - abs(16 - word_count))

        if 35 <= len(sentence) <= 180:
            score += 4

        if ":" in sentence:
            score += 2

        if re.search(r"\b(?:cgpa|sgpa|result|student name|branch|deadline|internship|scholarship|project|experience|education)\b", lower):
            score += 4

        if self._DATE_PATTERN.search(sentence):
            score += 2

        if document_type == "resume" and re.search(r"\b(?:cgpa|internship|scholarship|project|experience|skills|education|amazon|ibm)\b", lower):
            score += 4
        elif document_type == "academic document" and re.search(r"\b(?:result|sgpa|cgpa|hall ticket|registration|branch|grade)\b", lower):
            score += 4
        elif document_type in {"faq", "notice", "general pdf"} and re.search(r"\b(?:deadline|eligible|apply|upload|portal|summary)\b", lower):
            score += 3

        if "http" in lower:
            score -= 1

        return score

    def _starts_new_section(self, line: str) -> bool:
        return bool(re.match(r"^(?:\d+[.)]?\s+|q[:.]\s+|question[:.]\s+|ans[:.]\s+)", line, re.IGNORECASE))

    def _ensure_sentence(self, text: str) -> str:
        text = self._clean_sentence(text)
        if not text:
            return ""
        if not text.endswith((".", "!", "?")):
            text += "."
        return text

    def _sentence_overlap(self, first: str, second: str) -> float:
        first_words = set(re.findall(r"\b[a-z0-9]+\b", first.lower()))
        second_words = set(re.findall(r"\b[a-z0-9]+\b", second.lower()))
        if not first_words or not second_words:
            return 0.0
        intersection = len(first_words & second_words)
        union = len(first_words | second_words)
        return intersection / union if union else 0.0

    def _find_name_candidate(self, lines: list[str]) -> str:
        labeled = self._extract_labeled_value(lines, ["student name", "name"])
        if labeled and 2 <= len(labeled.split()) <= 4:
            return labeled.title()

        title_case_pattern = re.compile(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b")
        for line in lines[:8]:
            stripped = self._strip_section_prefix(line)
            if any(keyword in stripped.lower() for keyword in ["university", "college", "institute", "cgpa", "branch", "department", "result", "semester", "hall ticket"]):
                continue
            matches = title_case_pattern.findall(stripped)
            for match in matches:
                if 2 <= len(match.split()) <= 4:
                    return match

        for line in lines[:8]:
            words = line.split()
            alpha_words = [word for word in words if word.isalpha()]
            if 2 <= len(alpha_words) <= 4 and all(word.isupper() for word in alpha_words):
                return " ".join(alpha_words).title()
        return ""

    def _find_institution(self, lines: list[str]) -> str:
        keywords = ["university", "institute", "college", "school", "research"]
        for line in lines[:14]:
            stripped = self._strip_section_prefix(line)
            lower = stripped.lower()
            if any(keyword in lower for keyword in keywords) and len(stripped.split()) <= 20:
                return stripped
        return ""

    def _find_degree(self, lines: list[str]) -> str:
        degree_pattern = re.compile(
            r"((?:B\.?\s*Tech|M\.?\s*Tech|Bachelor(?:'s)?|Master(?:'s)?)"
            r"[^.;|]*?(?:Engineering|Science|Technology)?[^.;|]*)",
            re.IGNORECASE,
        )
        for line in lines[:20]:
            stripped = self._strip_section_prefix(line)
            match = degree_pattern.search(stripped)
            if match:
                degree = match.group(1).strip(" ,;-")
                degree = re.sub(r"\s{2,}", " ", degree)
                return degree
        return ""

    def _extract_numeric_metric(self, lines: list[str], labels: list[str]) -> str:
        for label in labels:
            value = self._extract_labeled_value(lines, [label])
            if value:
                metric_match = re.search(r"([0-9]+(?:\.[0-9]+)?)", value)
                if metric_match:
                    return metric_match.group(1)

        for line in lines:
            for label in labels:
                metric_match = re.search(rf"{re.escape(label)}\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)", line, re.IGNORECASE)
                if metric_match:
                    return metric_match.group(1)
        return ""

    def _collect_highlights(self, lines: list[str], keywords: list[str], limit: int = 2) -> list[str]:
        highlights = []
        institution_words = ["university", "college", "institute", "school of"]
        for line in lines:
            stripped = self._strip_section_prefix(line)
            lower = stripped.lower()
            if any(keyword in lower for keyword in keywords):
                if any(word in lower for word in institution_words) and not any(core in lower for core in ["amazon", "ibm", "internship", "scholarship", "award", "project"]):
                    continue
                if stripped not in highlights:
                    highlights.append(stripped)
            if len(highlights) >= limit:
                break
        return highlights

    def _extract_labeled_value(self, lines: list[str], labels: list[str]) -> str:
        normalized_labels = [label.lower() for label in labels]
        known_labels = [
            "student name", "name", "branch", "department", "programme", "program",
            "registration no", "roll no", "roll number", "published on", "date", "exam date",
            "sgpa", "cgpa", "percentage", "grade", "institution"
        ]
        stop_pattern = "|".join(re.escape(label) for label in known_labels)

        for line in lines:
            for label in normalized_labels:
                pattern = re.compile(
                    rf"{re.escape(label)}\s*:\s*(.+?)(?=\s+(?:{stop_pattern})\s*:|$)",
                    re.IGNORECASE,
                )
                match = pattern.search(line)
                if match:
                    return match.group(1).strip()

        for index, line in enumerate(lines):
            lower = line.lower()
            for label in normalized_labels:
                if lower == label and index + 1 < len(lines):
                    return lines[index + 1].strip()
        return ""

    def _first_matching_line(self, lines: list[str], keywords: list[str]) -> str:
        for line in lines:
            stripped = self._strip_section_prefix(line)
            lower = stripped.lower()
            if any(keyword in lower for keyword in keywords):
                return stripped
        return ""

    def _topic_from_question(self, line: str) -> str:
        question = re.sub(r"^\d+\.\s*", "", line).strip().rstrip("?")
        lower = question.lower()

        if "bonafide certificate" in lower:
            return "the bonafide certificate format"
        if "accommodation" in lower or "hostel" in lower:
            return "how to request hostel accommodation"
        if "re-upload" in lower or "wrongly uploaded" in lower:
            return "whether an uploaded file can be replaced"
        if "photo" in lower and "size" in lower:
            return "photo size requirements"
        if "academic documents" in lower or "documents" in lower:
            return "which academic documents must be uploaded"

        return question[:1].lower() + question[1:] if question else ""

    def _join_phrases(self, phrases: list[str]) -> str:
        phrases = [phrase.strip().rstrip(".") for phrase in phrases if phrase.strip()]
        if not phrases:
            return ""
        if len(phrases) == 1:
            return phrases[0]
        if len(phrases) == 2:
            return f"{phrases[0]} and {phrases[1]}"
        return f"{', '.join(phrases[:-1])}, and {phrases[-1]}"

    def _strip_label_text(self, text: str) -> str:
        cleaned = re.sub(r"^(?:Ans|Answer|Q|Question)[:.]\s*", "", text, flags=re.IGNORECASE)
        return self._clean_sentence(cleaned)

    def _strip_section_prefix(self, text: str) -> str:
        stripped = re.sub(r"^\d{4}\s*(?:[-–]\s*\d{4}|\d{4})?\s+", "", text)
        for prefix in self._SECTION_PREFIXES:
            stripped = re.sub(rf"^{prefix}\s+", "", stripped, flags=re.IGNORECASE)
        return self._clean_sentence(stripped)