# 🎧 AI Audiobook — AudioScribe
AudioScribe is a full-stack AI-powered web application that transforms written content into fully narrated audiobooks using cutting-edge artificial intelligence. Built with a modern React frontend and a Python Flask backend, the application bridges the gap between text and audio, making knowledge more accessible and engaging for everyone.
Convert PDFs and topics into narrated audiobooks using **Murf AI** for TTS and **Gemini** for content generation.

---

## 📁 Project Structure

```
ai-audiobook/
├── backend/
│   ├── app.py               ← Flask API server
│   ├── pdf_parser.py        ← PDF text extraction
│   ├── topic_generator.py   ← Gemini AI content generation
│   ├── murf_service.py      ← Murf AI TTS integration
│   ├── requirements.txt
│   └── .env.example         ← Copy this to .env and fill in keys
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.jsx
    │   └── App.css
    └── package.json
```

---

## ⚙️ Backend Setup

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in:
```
MURF_API_KEY=your_murf_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

### 3. Run the Flask server
```bash
python app.py
```
Server runs at: `http://localhost:5000`

---

## 🖥️ Frontend Setup

```bash
cd frontend
npm install
npm start
```
App runs at: `http://localhost:3000`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/pdf-to-audio` | Upload PDF → get MP3 |
| POST | `/api/topic-to-audio` | Topic string → get MP3 |
| GET | `/api/voices` | List available voices |

---

## 🔑 Murf API Key — Exactly Where It's Used

The Murf API key lives in `backend/.env` as `MURF_API_KEY`.

It is loaded and used **only** in `backend/murf_service.py`, in the `Authorization` header when calling:
```
POST https://api.murf.ai/v1/speech/generate
```

**Never put the API key in the frontend code.**

---

## 🚀 Features

- 📄 **PDF Upload** — drag & drop any PDF to extract text and narrate it
- ✦ **Topic Mode** — enter any topic; Claude writes the content, Murf narrates it
- 🎙️ **6 Voices** — choose from US, UK, and Indian English narrators
- 🎧 **In-browser playback** with animated waveform
- ⬇️ **MP3 Download** — save the audiobook locally
