# 🌍 WanderAI • Immersive AI Travel Guide & Audio Companion

> An intelligent, multilingual travel companion that transforms any world landmark into an interactive storytelling experience with studio-quality voice narration, cultural lore, insider tips, and real-time AI tour guide Q&A.

---

## ✨ Key Features & Highlights

1. **🎙️ Studio-Grade Multilingual Voice Guides (Murf AI FALCON)**
   - High-fidelity voice synthesis across **English**, **Hindi (हिन्दी)**, **Tamil (தமிழ்)**, and **Telugu (తెలుగు)**.
   - Persona selection between **Male** and **Female** narrators.
   - Intelligent text sanitization ensuring natural spoken cadence without robotic artifacts.
   - Automatic fallback to browser Web Speech API for uninterrupted offline resilience.

2. **🧠 Deep Cultural Intelligence (Google Gemini 3.8 Flash)**
   - **Dual Tour Depths**: Choose between a *⚡ 1-Minute Quick Summary* or a *📖 3-Minute Storytelling Tour*.
   - **Smart Traveler Insights**: Generates best season to visit, poetic destination taglines, insider secrets, and top 3 must-see highlights.
   - **💬 Ask the AI Guide Concierge**: Travelers can ask arbitrary follow-up questions (e.g., dress codes, famous street food, photography spots) and receive instantaneous personalized advice.

3. **🔍 Universal Destination Explorer**
   - Live interactive search filtering for featured monuments (*Taj Mahal, Red Fort, Gateway of India, Hawa Mahal, Golden Temple, Mysore Palace*).
   - **Global Search Capability**: Search *any* destination in the world (e.g., *Colosseum, Kyoto, Eiffel Tower, Machu Picchu*) to generate instant AI voice guides on demand.
   - One-click Google Maps integration.

4. **🎵 Custom Audio Controller & Live Soundwave Equalizer**
   - Animated visualizer bars synchronized with audio playback.
   - Variable playback speeds (**1.0x**, **1.25x**, **1.5x**).
   - 10-second quick seek controls (rewind & forward).
   - Interactive scrub bar and direct **MP3 audio guide download**.
   - Collapsible transcript viewer with one-click clipboard copy.

5. **💎 Luxury Glassmorphic Design**
   - Curated typography (*Playfair Display*, *Outfit*, and *Plus Jakarta Sans*).
   - Amber-orange sun-gold brand palette with subtle glow dynamics.
   - Dynamic category pills (*All Places, Wonders, Forts & Palaces, Spiritual, Architecture*).

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, Tailwind CSS (CDN), Modern ES6+ JavaScript.
- **Backend**: Python 3.13, Flask 3.0, Flask-CORS.
- **AI & Speech Models**:
  - **Google Gemini API** (`gemini-3.8-flash` with fallback to `gemini-3.5-flash-lite`) via `google-genai` SDK.
  - **Murf AI Falcon API** (`https://global.api.murf.ai/v1/speech/stream`) for studio voice generation.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure Python 3.10+ is installed and environment dependencies are available.

### 2. Configure Environment Variables
Inside `Backend/.env` (and root `.env`):
```env
MURF_API_KEY=your_murf_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Backend Server
```bash
# Using existing virtual environment:
.\.venv\Scripts\python.exe Backend/app.py

# Or standard python:
python Backend/app.py
```
The server will start on `http://127.0.0.1:5000`.

### 4. Open Frontend
Open `Frontend/index.html` (or `index.html`) directly in any modern browser:
```bash
start Frontend/index.html
```
*(Alternatively, use VS Code Live Server or any static web server)*.

---

## 📡 API Endpoints

- `GET /` — Health status and active models.
- `POST /generate-audio-guide` — Generates narrative text, metadata (tagline, best time, tips), and base64 encoded MP3 audio stream.
- `POST /ask-guide` — Interactive tour guide conversational Q&A endpoint.
