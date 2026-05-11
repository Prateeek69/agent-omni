<div align="center">

# 🧠 Agent-Omni

### Transform unstructured documents into actionable intelligence : locally, privately, instantly.

*Inspired by enterprise document intelligence systems, built from scratch, runs on your machine.*

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Tesseract](https://img.shields.io/badge/Tesseract-OCR-4285F4?style=flat-square)](https://github.com/tesseract-ocr/tesseract)
[![Whisper](https://img.shields.io/badge/Whisper-STT-412991?style=flat-square)](https://github.com/openai/whisper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---


## 🧠 What is this?

**Agent-Omni** is a high-performance, local-first document intelligence system designed to transform unstructured multimodal data into actionable insights. Unlike traditional cloud-dependent summarizers, Agent-Omni utilizes a modular **agent-based architecture** to orchestrate specialized tasks, from OCR and audio transcription to advanced reasoning, all within the privacy of your local environment.

By combining intelligent **intent routing** with a structured **multi-agent pipeline**, the system doesn't just extract text; it understands the document's purpose, selects the appropriate processing agents, and generates context-aware summaries with verifiable confidence scores.


---

## ✨ Features

| Modality | Input | How It Works |
|---|---|---|
| 📄 **PDF Analysis** | Any PDF (native or scanned) | PyMuPDF extraction → Tesseract OCR fallback → Reasoning Agent |
| 🖼️ **Image Extraction** | Scans, photos, handwritten notes | Deep-layer OCR → Noise filtering → Structured summary |
| 🎙️ **Audio Transcription** | Spoken recordings | Local Whisper STT → text chunks → Reasoning Agent |
| ✍️ **Raw Text** | Paste any text | Direct Reasoning Agent pass → instant synthesis |

- 🛡️ **100% Local** — zero external API calls, zero data leakage
- 🔀 **Intent-Aware Routing** — automatically detects Resumes, Syllabi, Invoices, Medical docs
- 🔁 **Self-Correction Loop** — low-confidence outputs trigger a second reasoning pass
- 📊 **Confidence Scoring** — multi-factor verification of extraction + reasoning quality
- ⏱️ **Agent Timeline** — real-time visibility into every step of the pipeline

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│              User Input Layer                   │
│     PDF  │  Image  │  Audio  │  Raw Text        │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         Router Agent (Intent Detection)         │
│  Keyword-proximity + Structural Analysis        │
│  → Detects: Resume / Syllabus / Invoice / ...   │
└──────────┬──────────────────────┬───────────────┘
           │                      │
     ┌─────▼──────┐        ┌──────▼──────┐
     │  OCR Agent │        │ Audio Agent │
     │ PyMuPDF +  │        │  Whisper    │
     │ Tesseract  │        │    STT      │
     └─────┬──────┘        └──────┬──────┘
           │                      │
           └──────────┬───────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│           Reasoning Agent (The Brain)           │
│  Heuristic Sentence Ranking · Template Engine   │
│  Self-Correction Loop (2nd pass if low-conf.)   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│             Aggregator Service                  │
│  Unifies agent outputs · Calculates Confidence  │
│  Builds Agent Timeline                          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              API Layer (FastAPI)                │
│  REST endpoints · Async · Local file serving    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         Frontend (React 18 + Tailwind CSS)      │
│  Result View · Agent Timeline · Mode Tabs       │
└─────────────────────────────────────────────────┘
```

---

## 🤖 Agent System (Deep Dive)

### Router Agent — *The Traffic Controller*
Uses a hybrid **keyword-proximity + structural analysis** to detect document intent before any heavy processing begins. Only allocates agents that are actually needed for the task.

**Output:** `intent`, `agents_used`

---

### OCR Agent — *The Extractor*
Runs a **fallback-first** strategy:
1. Attempts native PDF text extraction via **PyMuPDF** (fast, lossless)
2. Falls back to **Tesseract OCR** if the document is scanned or text is non-selectable
3. Applies noise filtering to remove OCR garbage before passing data downstream

---

### Audio Agent — *The Listener*
Transcribes audio recordings into raw text chunks using a **local Whisper model**, no cloud STT API required. Output is normalized and passed directly to the Reasoning Agent.

---

### Reasoning Agent — *The Brain*
The most sophisticated component. Operates in two stages:

**Stage 1 — Initial Synthesis:**
Scores every extracted sentence using a **Heuristic Ranking Algorithm** based on:
- **Density** — ratio of alpha characters to noise/symbols
- **Keyword Weight** — high-signal terms like *"Deadline"*, *"Required"*, *"Experience"*
- **Structural Signal** — proximity to headers or bullet points

Generates a structured summary using **document-type templates** (Resume, Syllabus, Medical, Invoice).

**Stage 2 — Self-Correction Loop:**
Evaluates output against a **Confidence Model**. If the summary is too generic (placeholder-heavy) or key entities (Dates, Names) are missing despite being present in the source text, it triggers a **second reasoning pass** to refine and boost confidence.

---

### Aggregator Service — *The Consensus Layer*
Unifies data from all active agents, builds the **Agent Timeline**, and computes the final **Confidence Score** using a multi-factor model:

| Factor | Weight |
|---|---|
| OCR Confidence | 0.4 |
| Word Density | 0.2 |
| Valid Word Ratio | 0.2 |
| Noise Ratio | 0.2 |

---

## 🧠 Tech Stack

**Backend**
- `Python 3.9+` · `FastAPI` · `Uvicorn`
- `Tesseract OCR` · `PyMuPDF`
- `Whisper` (Local Audio Transcription)
- `NLTK` · `Regex` (Information Extraction)
- `Local Persistent Storage Service`

**Frontend**
- `React 18` · `Vite` · `TailwindCSS`
- `Lucide-React` (Icons)
- `React Hooks` (Local-first state management)

---

## 📁 Project Structure

```
agent-omni/
│
├── backend/
│   └── app/
│       ├── agents/             # Agent logic (Reasoning, OCR, Audio, Router)
│       ├── services/           # Aggregator, Storage, Normalization
│       ├── routers/            # FastAPI endpoints (analyze.py)
│       ├── utils/              # Text cleaning, pattern matching
│       └── main.py             # Entry point
│
└── frontend/
    └── src/
        ├── components/         # UI: ResultView, ModeTabs, SurfaceCard
        ├── views/              # Page layouts
        ├── api/                # Backend communication
        └── App.jsx             # Main orchestrator
```

---

## ⚙️ How It Works

**The Processing Pipeline**

1. **Input Received** — System accepts a file (PDF, Image, Audio) or raw text
2. **Intent Detection** — Router Agent performs a cold-start analysis to determine document type
3. **Agent Allocation** — Only the required agents are spun up based on intent + file type
4. **Extraction & Cleaning** — OCR/Audio agents extract raw data; noise is filtered before downstream use
5. **Reasoning Pass** — Reasoning Agent ranks sentences, applies a document-specific template, and synthesizes a structured summary
6. **Self-Correction** — If confidence is low, a second reasoning pass is triggered automatically
7. **Aggregation** — Aggregator compiles all agent outputs, scores confidence, and builds the timeline
8. **UI Rendering** — React frontend displays the Result View with summaries, key points, and agent activity

---

## 📸 Demo

### 🧭 Workspace & Upload Interface  
> Clean, local-first workspace for uploading and analyzing documents across multiple modalities

<img width="1920" height="1080" alt="Screenshot (321)" src="https://github.com/user-attachments/assets/b32616fd-f3db-457e-83e1-921fed07640a" />


### ⚙️ Processing Pipeline (Live Agent Execution)  
> Real-time view of the multi-agent pipeline as your file is processed step-by-step

<img width="1437" height="952" alt="Screenshot (319)" src="https://github.com/user-attachments/assets/fc9cc5cd-6a24-4a87-a791-777b9c7d8bca" />


### 📄 PDF Analysis & Summary  
> Structured summary with high-confidence scoring and extracted insights from a PDF document

<img width="1920" height="1080" alt="Screenshot (317)" src="https://github.com/user-attachments/assets/1b7d8a85-0a83-40e6-99c1-17215144d129" />

### 🤖 Agent Activity & Reasoning  
> Transparent breakdown of which agents were used and how the system reasoned through the document

<img width="1920" height="1080" alt="Screenshot (318)" src="https://github.com/user-attachments/assets/65804807-c0f8-4a39-b310-d1347bafa8db" />


### 🖼️ Image / Medical Document Analysis  
> Multimodal capability: extracting structured insights from real-world images and medical records

<img width="1920" height="962" alt="Screenshot (320)" src="https://github.com/user-attachments/assets/2c951bee-caec-4eca-bb91-042224de1a10" />

---

## ⚡ Performance & Characteristics

| Characteristic | Detail |
|---|---|
| Execution Environment | Fully local — no internet required |
| Latency | Optimized for consumer-grade hardware |
| OCR Strategy | Native extraction → Tesseract fallback |
| Noise Handling | Regex-based repetition detection + Noise Sentinels |
| Context Awareness | Document-type templates (Resume, Syllabus, Medical, Invoice) |
| Privacy | Zero external API calls — no data leaves your machine |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/Prateeek69/agent-omni.git
cd agent-omni

# Install backend dependencies
pip install -r requirements.txt

# Start the API server
uvicorn backend.app.main:app --reload

# Start the frontend
cd frontend && npm install && npm run dev
```

---

## 💡 Key Concepts Demonstrated

- **Multimodal AI Integration** — unified pipeline handling PDFs, images, audio, and text
- **Agent-Based Orchestration** — specialized logic units sharing a stateful context
- **Self-Correction Loops** — iterative reasoning passes to improve output quality automatically
- **Privacy-First Engineering** — complex AI system with zero data leakage by design
- **Heuristic NLP** — sentence ranking and confidence modeling without an LLM

---

## 👨‍💻 Author

**Prateek Mishra**

[![GitHub](https://img.shields.io/badge/GitHub-Profile-black?style=for-the-badge&logo=github)](https://github.com/Prateeek69)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/prateeek-mishra/)

---

<div align="center">

⭐ **Star this repo if you found it useful**, it helps others discover it!

*Built with curiosity, local hardware, and zero cloud bills.*

</div>
