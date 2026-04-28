import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from app.utils.text_cleaner import clean_text
import os
import re


class OCRAgent:
    """
    OCR Agent responsible for extracting text from images and PDFs.
    """

    def __init__(self):
        pass

    def process(self, file_path: str) -> dict:
        ext = os.path.splitext(file_path)[1].lower()

        if ext in [".png", ".jpg", ".jpeg"]:
            text = self._process_image(file_path)

        elif ext == ".pdf":
            text = self._process_pdf(file_path)

        else:
            text = ""

        # Post-Processing
        text = self._post_process_ocr(text)

        return {
            "text": clean_text(text)
        }

    def _process_image(self, file_path: str) -> str:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text.strip()

    def _process_pdf(self, file_path: str) -> str:
        pages = convert_from_path(file_path)
        extracted_text = ""

        for page in pages:
            extracted_text += pytesseract.image_to_string(page) + "\n"

        return extracted_text.strip()

    def _post_process_ocr(self, text: str) -> str:
        if not text:
            return ""

        lines = text.split("\n")
        valid_lines = []

        for line in lines:
            line = line.strip()
            
            # Skip short lines
            if len(line) < 20:
                continue

            alpha_count = sum(c.isalpha() for c in line)
            total_count = len(line)
            
            # Skip if mostly symbols
            if total_count > 0 and (total_count - alpha_count) / total_count > 0.4:
                continue

            # Need at least a few proper words
            words = [w for w in line.split() if any(c.isalpha() for c in w)]
            if len(words) < 3:
                continue

            valid_lines.append(line)

        return "\n".join(valid_lines)