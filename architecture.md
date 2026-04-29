# Agent-Omni: Technical Architecture & System Flow

Agent-Omni is a high-performance, multimodal AI document intelligence system designed for fast, local-first processing of text, images, PDFs, and audio. It utilizes a multi-agent orchestration pattern to extract, clean, and reason over unstructured data.

## 🏗️ System Overview

The project is split into two main layers:
1.  **Frontend (React/Vite)**: A premium, SaaS-style dashboard providing real-time feedback, history management, and interactive AI insights.
2.  **Backend (FastAPI)**: A modular agent-based pipeline that handles heavy lifting (OCR, Audio Transcription, Reasoning).

---

## 🔄 End-to-End Flow

### 1. Input Ingestion
The user uploads a file (PDF, Image, Audio) or pastes text. The frontend determines the `mode` and sends it to the `/upload` endpoint.

### 2. Multi-Agent Pipeline
The backend uses a specialized set of agents to process the input:
-   **OCR Agent**: Uses `pytesseract` and `pdf2image` to extract text from images and scanned PDFs. It includes recursive processing for multi-page documents.
-   **Audio Agent**: Uses OpenAI's `Whisper` (or equivalent local model) to transcribe audio files into clean text.
-   **Router Agent**: Determines if direct text extraction (via `PyMuPDF`) is possible before falling back to OCR, ensuring maximum speed.

### 3. Reasoning & Intelligence (The Brain)
The `ReasoningAgent` is the core of the system. It performs:
-   **Heuristic Cleaning**: Removes noise like "Page 1 of 5", "Scanned with...", and broken characters.
-   **Document Type Detection**: Uses keyword matching and structural analysis to classify documents (e.g., Resume, Transcript, Invoice).
-   **Entity Recognition**: Extracting dates, organizations, and names using regex and pattern matching.
-   **Context-Aware Summarization**: Ranks sentences based on their value to the detected document type and merges them into a coherent summary.
-   **Smart Action Generation**: Suggests next steps (e.g., "ATS Review" for resumes) based on the context.

### 4. Output & Presentation
The final payload is a structured JSON containing:
-   `summary`: A cleaned, human-readable takeaway.
-   `key_points`: Modular snippets of the most important data.
-   `insights`: AI-calculated metadata (Tone, Usefulness Score, Suggested Next Step).
-   `raw_extracted_text`: For traceability and debugging.

---

## 🎨 UI/UX Design Philosophy

-   **Premium SaaS Aesthetic**: Uses a custom design system with Inter/Outfit typography, glassmorphism headers, and smooth animations.
-   **State Management**: Utilizes React hooks (`useState`, `useEffect`, `useMemo`, `useRef`) for a reactive, zero-latency feel.
-   **Local-First History**: History is persisted in `localStorage`, allowing users to revisit previous analyses without server-side database dependencies.
-   **Adaptive UI**: Components like `ResultView` dynamically change their layout and "Smart Actions" based on the detected document type.

---

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React 18 (Vite)
-   **Styling**: Tailwind CSS 4 & Vanilla CSS Variables
-   **Icons**: Lucide React
-   **State**: LocalStorage & React State

### Backend
-   **Framework**: FastAPI (Python 3.10+)
-   **Processing**: 
    -   `pytesseract` (OCR)
    -   `PyMuPDF` (PDF Extraction)
    -   `librosa` / `pydub` (Audio preprocessing)
    -   `openai-whisper` (Transcription)
-   **Server**: Uvicorn with Auto-reload

---

## 🚀 Performance Optimizations

1.  **Direct vs OCR**: The system always tries direct PDF text extraction first, which is 10x faster than OCR.
2.  **Staged Loading**: The frontend displays a multi-step loader ('Extracting...', 'Running AI...') to keep users engaged during processing.
3.  **Heuristic Ranking**: Instead of full-text processing, the ReasoningAgent ranks the top 20% of content to generate high-density summaries quickly.
