# EmotionVerse AI
## Multi-Modal Human Emotion Intelligence for Healthcare and Education

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8.svg?style=flat&logo=opencv)](https://opencv.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python)](https://python.org)

**EmotionVerse AI** is an academic-grade, full-stack affective computing platform that perceives, models, and decodes human emotions across three sensory modalities:
1. **Facial Expressions** (Live webcam stream / image upload with OpenCV Haar Cascade detection)
2. **Voice Acoustics** (Browser microphone recordings / audio file prosody, pitch $F_0$, and RMS energy)
3. **Natural Text Sentiment** (NLP semantic valence, keyword arousal, and transformer pipelines)

The system integrates these channels using **Multimodal Late Fusion** with dynamically normalized weights, cross-modal agreement scoring, conflict/mixed-emotion detection, cognitive engagement estimation, and personalized recommendations for **Education** and **Healthcare Support** settings.

> **Academic & Research Notice**: EmotionVerse AI is an educational research demonstration system. It is **NOT** a certified medical diagnostic device. It adheres to strict zero-retention privacy standards with in-memory media processing.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Features](#4-features)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Installation Instructions](#7-installation-instructions)
8. [Backend Setup](#8-backend-setup)
9. [Frontend Setup](#9-frontend-setup)
10. [Environment Variables](#10-environment-variables)
11. [Running the Application](#11-running-the-application)
12. [API Documentation](#12-api-documentation)
13. [Multimodal Fusion Explanation](#13-multimodal-fusion-explanation)
14. [Demo Mode Explanation](#14-demo-mode-explanation)
15. [Project Limitations](#15-project-limitations)
16. [Future Improvements](#16-future-improvements)

---

## 1. Project Overview

Emotion recognition based on a single modality (such as facial appearance or text alone) frequently suffers from ambiguity, masking, and noise. For instance, a student smiling politely while writing anxious thoughts about an exam presents a contradiction that single-channel models fail to identify.

**EmotionVerse AI** addresses this challenge through late multimodal fusion. By gathering probability distributions from Face, Voice, and Text channels, normalizing weights based on available inputs, and calculating a cross-modality agreement score, it achieves robust emotion classification, flags mixed emotional states, and delivers context-sensitive recommendations.

---

## 2. Problem Statement

1. **Unimodal Fragility**: Facial expressions can be faked or masked; voice signals are vulnerable to ambient noise; text lacks intonation and vocal inflections.
2. **Missing Modality Challenge**: Real-world users rarely provide all three modalities at once. Systems must gracefully handle any permutation (1, 2, or 3 inputs).
3. **Context Agnosticism**: Standard AI models output generic emotion labels ("sad", "angry") without translating them into actionable, domain-specific guidance (e.g., educational pacing vs. healthcare grounding).
4. **Opaque Diagnostic Claims**: Commercial emotion apps often falsely claim diagnostic medical power without ethical guardrails or privacy protections.

---

## 3. Objectives

- Design a modular, production-ready architecture with clean separation of AI models, business services, API endpoints, and UI layers.
- Support 7 standard Ekman emotion categories: **Happy, Sad, Angry, Fear, Surprise, Disgust, Neutral**.
- Derive higher-level constructs: **Mood Valence** (Positive, Neutral, Negative) and **Engagement Level** (High, Medium, Low).
- Implement dynamic weighted late fusion with cross-channel conflict detection.
- Provide domain-tailored recommendations for **Education** (cognitive load, quizzes, study pacing) and **Healthcare Support** (breathing exercises, supportive self-care, professional consultation advice).
- Store historical sessions in a SQLite database with analytics and longitudinal trends.

---

## 4. Features

- **Live Webcam & Image Analysis**: Face detection using OpenCV Haar Cascades with real-time bounding box annotations and confidence scores.
- **Microphone Recording & Audio Waveform**: Web Audio API integration with animated amplitude bar visualization and acoustic feature extraction.
- **NLP Text Sentiment Engine**: Semantic valence scoring with intensifiers, negation handling, and sample scenario presets.
- **Interactive Fusion Pipeline Diagram**: Animated UI showing the flow of active modalities into the central late-fusion engine.
- **Recharts Data Visualization**: Toggle between 7-emotion Radar Charts and Colored Probability Bar Charts.
- **Engagement & Agreement Gauges**: Instant visual feedback on cross-modal coherence and user attention level.
- **Longitudinal Analytics**: History logs, emotion distribution pie charts, confidence timelines, and filter by context mode.
- **Privacy First**: Temporary media is processed in-memory or deleted immediately after inference.

---

## 5. System Architecture

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                    FRONTEND (React + Vite)               │
                               │                                                          │
                               │   [ FaceAnalyzer ]    [ VoiceAnalyzer ]   [ TextAnalyzer]│
                               └──────────┬────────────────────┬──────────────────┬───────┘
                                          │                    │                  │
                                          │ POST /analyze/face │ /analyze/audio   │ /analyze/text
                                          ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND CORE                                      │
│                                                                                         │
│  ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │   FaceEmotionModel    │   │   AudioEmotionModel   │   │     TextEmotionModel      │  │
│  │ (OpenCV Haar Cascade) │   │ (Pitch F0, RMS Energy)│   │(Valence Semantic Lexicon) │  │
│  └──────────┬────────────┘   └───────────┬───────────┘   └─────────────┬─────────────┘  │
│             │                            │                             │                │
│             └───────────────────┐        │        ┌────────────────────┘                │
│                                 ▼        ▼        ▼                                     │
│                              ┌────────────────────────┐                                 │
│                              │ MultimodalFusionModel  │ ◄── Dynamic Weight Normalization│
│                              │   (Weighted Softmax)   │ ◄── Cosine Agreement Scoring    │
│                              └───────────┬────────────┘ ◄── Mixed Emotion Conflict Flag │
│                                          │                                              │
│                                          ▼                                              │
│                              ┌────────────────────────┐                                 │
│                              │ RecommendationService  │                                 │
│                              │ (Education/Healthcare) │                                 │
│                              └───────────┬────────────┘                                 │
│                                          │                                              │
│                                          ▼                                              │
│                              ┌────────────────────────┐                                 │
│                              │   SQLAlchemy SQLite    │ (Session & History Storage)     │
│                              └────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3.4 (Custom Dark Cyberpunk & Glassmorphism Theme)
- **Charts**: Recharts (Radar, Bar, Pie, Line charts)
- **Icons**: Lucide React
- **Audio Recording**: Web Audio API + MediaRecorder

### Backend
- **Framework**: FastAPI (Asynchronous REST API)
- **Server**: Uvicorn with ASGI
- **Data Validation**: Pydantic v2 + Pydantic-Settings
- **ORM / Database**: SQLAlchemy 2.0 with SQLite
- **Computer Vision**: OpenCV Headless 4.10
- **Audio Processing**: SoundFile, SciPy (Signal Processing)
- **Numerical Computing**: NumPy 2.x

---

## 7. Installation Instructions

Ensure you have:
- **Python 3.11+** (or Python 3.13)
- **Node.js 18+** (Node.js 20+ LTS recommended)
- **Git**

Clone the repository:
```bash
git clone https://github.com/your-username/emotionverse-ai.git
cd emotion_vs_AI
```

---

## 8. Backend Setup

1. Open a terminal in the project root:
```bash
cd backend
```

2. Create and activate a Python virtual environment:
```powershell
# Windows (PowerShell)
py -3 -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

3. Install backend dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

4. Create configuration file:
```bash
cp .env.example .env
```

---

## 9. Frontend Setup

1. Open a new terminal in the project root:
```bash
cd frontend
```

2. Install npm dependencies:
```bash
npm install
```

---

## 10. Environment Variables

In `backend/.env`:
```ini
APP_NAME="EmotionVerse AI"
APP_VERSION="1.0.0"
API_PREFIX="/api"
ENVIRONMENT="development"
DEBUG=true
DEMO_MODE=false
DEFAULT_FACE_WEIGHT=0.35
DEFAULT_AUDIO_WEIGHT=0.35
DEFAULT_TEXT_WEIGHT=0.30
AGREEMENT_THRESHOLD=0.45
DATABASE_URL="sqlite:///./emotionverse.db"
```

---

## 11. Running the Application

### Start the Backend Server
```powershell
cd backend
.\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: **`http://localhost:8000`**  
Interactive OpenAPI Documentation: **`http://localhost:8000/docs`**

### Start the Frontend Dev Server
```powershell
cd frontend
npm run dev
```
Frontend web application will be live at: **`http://localhost:5173`**

---

## 12. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health status, mode, and loaded modalities |
| `POST` | `/api/analyze/face` | Upload image file for OpenCV facial detection & emotion inference |
| `POST` | `/api/analyze/face-base64` | Analyze base64 image data URI from live webcam stream |
| `POST` | `/api/analyze/audio` | Upload or record audio file (WAV/MP3/WEBM) for prosody analysis |
| `POST` | `/api/analyze/text` | Analyze natural language text message for sentiment & emotions |
| `POST` | `/api/analyze/fusion` | Combine available modality results via late fusion |
| `POST` | `/api/analysis/save` | Store an emotion session record to the SQLite database |
| `GET` | `/api/analysis/history` | Retrieve historical analysis logs (filter by limit & context_mode) |
| `GET` | `/api/analysis/stats` | Aggregate summary stats (emotion distribution, mood, engagement) |
| `DELETE` | `/api/analysis/{id}` | Delete a specific analysis record from database |

---

## 13. Multimodal Fusion Explanation

### Mathematical Formulation
Let $M \subseteq \{\text{face}, \text{audio}, \text{text}\}$ be the set of active modalities.  
Each modality outputs a probability distribution vector:
$$P_m = [p_m(e_1), p_m(e_2), \dots, p_m(e_7)], \quad \sum_{i=1}^7 p_m(e_i) = 1$$

Raw user/system weights $\alpha_m$ (default: $\alpha_{\text{face}} = 0.35, \alpha_{\text{audio}} = 0.35, \alpha_{\text{text}} = 0.30$) are dynamically normalized:
$$w_m = \frac{\alpha_m}{\sum_{k \in M} \alpha_k}, \quad \sum_{m \in M} w_m = 1.0$$

The fused probability for each emotion $e$ is calculated as:
$$P_{\text{final}}(e) = \frac{\sum_{m \in M} w_m \cdot P_m(e)}{\sum_{e'} \sum_{m \in M} w_m \cdot P_m(e')}$$

### Agreement Scoring
For $|M| \ge 2$, cross-modal agreement is computed using pairwise cosine similarity:
$$\text{Agreement}(M) = \frac{1}{\binom{|M|}{2}} \sum_{i < j} \frac{P_i \cdot P_j}{\|P_i\|_2 \|P_j\|_2}$$

If $\text{Agreement}(M) < \tau$ (where $\tau = 0.45$), a **Conflict / Mixed Emotion** alert is triggered.

---

## 14. Demo Mode Explanation

Because large deep neural networks (such as 500MB Vision Transformers or BERT models) can be slow to download during quick evaluations, the system includes:
- **`DEMO_MODE=false` (Default)**: Executes native OpenCV face geometry analysis, real SciPy/SoundFile acoustic audio feature extraction, and lexical semantic NLP.
- **Visual Distinction**: Every result includes an explicit `is_fallback: boolean` property. In the UI, cards display **REAL MODEL** (cyan) or **DEMO / FALLBACK MODE** (amber).
- **Pluggable Weights Hook**: Dedicated comments in `face_model.py`, `audio_model.py`, and `text_model.py` allow inserting PyTorch/ONNX trained models with 2 lines of code.

---

## 15. Project Limitations

1. **Haar Cascade vs. Extreme Lighting**: OpenCV Haar Cascades require adequate ambient lighting and frontal head pose.
2. **Microphone Hardware Variance**: In-browser recordings depend on microphone frequency response and gain calibration.
3. **Short Text Sparsity**: Inputs containing only 1-2 words offer limited contextual valence compared to full sentences.
4. **Academic Prototype**: Not certified as a clinical medical or diagnostic tool.

---

## 16. Future Improvements

- [ ] **Transformer Ensembles**: Fine-tune Wav2Vec2 on RAVDESS and DistilBERT on GoEmotions.
- [ ] **Facial Action Unit (FACS) Analysis**: Track fine-grained micro-expressions (AU1, AU4, AU12) using MediaPipe FaceMesh.
- [ ] **Real-time WebSockets**: Stream 30fps webcam feeds and microphone PCM streams over full-duplex WebSockets.
- [ ] **Wearable Sensor Fusion**: Integrate heart rate variability (HRV) and galvanic skin response (GSR) signals.
- [ ] **Federated Learning**: Enable on-device model personalization while maintaining privacy.

---

## License
MIT License. Developed for academic and educational research.
