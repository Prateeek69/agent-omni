import os
import re

import fitz
import pytesseract
from PIL import Image

from app.utils.text_cleaner import clean_text


class OCRAgent:
    """
    OCR Agent responsible for extracting text from images and PDFs.
    """

    _NOISE_PATTERNS = [
        re.compile(r"^(print|exit)$", re.IGNORECASE),
        re.compile(r"^page\s+\d+(?:\s+of\s+\d+)?$", re.IGNORECASE),
        re.compile(r"^scanned with .*$", re.IGNORECASE),
    ]

    def process(self, file_path: str) -> dict:
        ext = os.path.splitext(file_path)[1].lower()

        if ext in [".png", ".jpg", ".jpeg"]:
            raw_text = self._process_image(file_path)
            cleaned_text = self._post_process_text(raw_text)
            return {
                "text": cleaned_text,
                "method": "image_ocr",
                "has_selectable_text": False,
                "ocr_used": True,
                "text_quality": self._estimate_text_quality(cleaned_text, from_ocr=True),
            }

        if ext == ".pdf":
            extracted = self._process_pdf(file_path)
            extracted["text"] = self._post_process_text(extracted.get("text", ""))
            extracted["text_quality"] = self._estimate_text_quality(
                extracted.get("text", ""),
                from_ocr=extracted.get("ocr_used", False),
            )
            return extracted

        return {
            "text": "",
            "method": "unsupported",
            "has_selectable_text": False,
            "ocr_used": False,
            "text_quality": "low",
        }

    def _process_image(self, file_path: str) -> str:
        image = Image.open(file_path).convert("RGB")
        text = pytesseract.image_to_string(image, config="--psm 6")
        return text.strip()

    def _process_pdf(self, file_path: str) -> dict:
        with fitz.open(file_path) as document:
            direct_pages = [page.get_text("text") for page in document]
            direct_text = "\n\n".join(
                page_text.strip()
                for page_text in direct_pages
                if page_text and page_text.strip()
            ).strip()

            if self._has_selectable_text(direct_text):
                return {
                    "text": direct_text,
                    "method": "pdf_text",
                    "has_selectable_text": True,
                    "ocr_used": False,
                }

            ocr_pages = []
            for page in document:
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                mode = "RGB" if pixmap.n < 4 else "RGBA"
                image = Image.frombytes(
                    mode,
                    [pixmap.width, pixmap.height],
                    pixmap.samples,
                )
                if mode == "RGBA":
                    image = image.convert("RGB")

                page_text = pytesseract.image_to_string(image, config="--psm 6")
                if page_text.strip():
                    ocr_pages.append(page_text.strip())

        return {
            "text": "\n\n".join(ocr_pages).strip(),
            "method": "pdf_ocr",
            "has_selectable_text": False,
            "ocr_used": True,
        }

    def _has_selectable_text(self, text: str) -> bool:
        if not text:
            return False

        alnum_count = len(re.findall(r"[A-Za-z0-9]", text))
        word_count = len(re.findall(r"\b\w+\b", text))
        return alnum_count >= 80 and word_count >= 20

    def _post_process_text(self, text: str) -> str:
        if not text:
            return ""

        normalized = text.replace("\r\n", "\n").replace("\r", "\n")
        normalized = normalized.replace("\u00a0", " ")
        normalized = re.sub(r"[|Ã‚Â¦]+", " | ", normalized)
        normalized = re.sub(r"\s+([,.;:!?])", r"\1", normalized)
        normalized = re.sub(r"([,.;:!?])(\w)", r"\1 \2", normalized)

        cleaned_lines = []
        seen = set()
        previous_line = ""

        for raw_line in normalized.split("\n"):
            line = re.sub(r"\s+", " ", raw_line).strip(" -")
            if not line:
                previous_line = ""
                continue

            if any(pattern.match(line) for pattern in self._NOISE_PATTERNS):
                previous_line = line
                continue

            if self._is_garbage_line(line):
                previous_line = line
                continue

            line = self._normalize_line_spacing(line)

            if cleaned_lines and self._should_merge_lines(cleaned_lines[-1], line):
                cleaned_lines[-1] = self._normalize_line_spacing(f"{cleaned_lines[-1]} {line}")
                previous_line = line
                continue

            normalized_line = line.lower()
            if normalized_line in seen:
                previous_line = line
                continue

            seen.add(normalized_line)
            cleaned_lines.append(line)
            previous_line = line

        return clean_text("\n".join(cleaned_lines), preserve_line_breaks=True)

    def _normalize_line_spacing(self, line: str) -> str:
        line = re.sub(r"\s+", " ", line).strip()
        line = re.sub(r"\s+([,.;:!?])", r"\1", line)
        line = re.sub(r"([,.;:!?])(\w)", r"\1 \2", line)
        line = re.sub(r"([A-Za-z])\s*\|\s*([A-Za-z])", r"\1, \2", line)
        line = re.sub(r"\s{2,}", " ", line)
        return line.strip()

    def _should_merge_lines(self, previous_line: str, current_line: str) -> bool:
        if not previous_line or not current_line:
            return False

        if previous_line.endswith((":", ",", "-", "/")):
            return True

        if len(previous_line.split()) <= 3 and len(current_line.split()) <= 10:
            return True

        if current_line[:1].islower() and not previous_line.endswith((".", "!", "?")):
            return True

        if re.match(r"^(?:CGPA|GPA|Branch|Department|University|College|Institute)\b", current_line, re.IGNORECASE):
            return True

        return False

    def _is_garbage_line(self, line: str) -> bool:
        alpha_count = sum(c.isalpha() for c in line)
        digit_count = sum(c.isdigit() for c in line)
        total_count = len(line)

        if total_count == 0:
            return True

        alpha_ratio = alpha_count / total_count
        symbol_ratio = sum(
            not c.isalnum() and not c.isspace() for c in line
        ) / total_count
        has_context_label = ":" in line or bool(
            re.search(
                r"\b(?:sgpa|cgpa|date|name|branch|subject|amount|fee|deadline|experience|education|project)\b",
                line,
                re.IGNORECASE,
            )
        )

        if alpha_count == 0 and digit_count < 3:
            return True

        if len(line) < 4 and not has_context_label:
            return True

        if alpha_ratio < 0.2 and not has_context_label and digit_count < 3:
            return True

        if symbol_ratio > 0.35 and "http" not in line.lower():
            return True

        return False

    def _estimate_text_quality(self, text: str, from_ocr: bool) -> str:
        if not text:
            return "low"

        tokens = re.findall(r"\S+", text)
        word_count = len(re.findall(r"\b\w+\b", text))
        if word_count < 15:
            return "low"

        noisy_tokens = 0
        for token in tokens:
            alpha_count = sum(char.isalpha() for char in token)
            if len(token) > 3 and alpha_count / max(len(token), 1) < 0.45 and not re.fullmatch(r"[0-9.,:/\-]+", token):
                noisy_tokens += 1

        noise_ratio = noisy_tokens / max(len(tokens), 1)

        if from_ocr:
            if noise_ratio > 0.18:
                return "low"
            if noise_ratio > 0.08:
                return "medium"
            return "medium"

        if noise_ratio > 0.22:
            return "low"
        if noise_ratio > 0.14:
            return "medium"
        return "high"