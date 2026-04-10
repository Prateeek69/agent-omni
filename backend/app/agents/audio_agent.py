import whisper


class AudioAgent:
    """
    Audio Agent responsible for converting speech to text.
    """

    def __init__(self, model_size: str = "base"):
        # Load whisper model once
        self.model = whisper.load_model(model_size)

    def process(self, file_path: str) -> dict:
        result = self.model.transcribe(file_path)

        return {
            "transcript": result.get("text", "").strip()
        }