import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import os


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

        return {
            "text": text
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