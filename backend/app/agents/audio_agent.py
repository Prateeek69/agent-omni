import whisper
from typing import Optional


class AudioAgent:
    """
    Audio Agent responsible for converting speech to text.
    Uses a singleton-like pattern for the model to avoid reloading.
    """
    _model = None

    def __init__(self, model_size: str = "base"):
        self.model_size = model_size

    @property
    def model(self):
        if AudioAgent._model is None:
            print(f"Loading Whisper model ({self.model_size})...")
            AudioAgent._model = whisper.load_model(self.model_size)
        return AudioAgent._model

    def process(self, file_path: str) -> dict:
        result = self.model.transcribe(file_path)

        return {
            "transcript": result.get("text", "").strip()
        }