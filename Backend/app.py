import os
import tempfile
import base64
import json
import re
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, ".env"))
load_dotenv()

app = Flask(__name__)
CORS(app)

MURF_API_KEY = os.getenv("MURF_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

MODEL_NAMES = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]

def clean_tts_text(text: str) -> str:
    """Removes markdown symbols like **, ##, *, backticks so TTS sounds natural."""
    clean = re.sub(r"[*#_`>~]", "", text)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean

def call_gemini(prompt: str) -> str:
    """Calls Gemini with fallback model support."""
    last_err = None
    for model_name in MODEL_NAMES:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"Model {model_name} failed: {e}")
            last_err = e
    raise last_err or Exception("All Gemini models failed")

def generate_speech(text: str, voice_id: str, locale: str):
    temp_audio = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    
    # Strip markdown before sending to TTS
    speech_text = clean_tts_text(text)
    # Murf streaming limit safety: truncate text if excessively long
    if len(speech_text) > 1800:
        speech_text = speech_text[:1800] + "..."

    url = "https://global.api.murf.ai/v1/speech/stream"
    headers = {
        "api-key": MURF_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "voice_id": voice_id,
        "text": speech_text,
        "locale": locale,
        "model": "FALCON",
        "format": "MP3",
        "sampleRate": 24000,
        "channelType": "MONO"
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code == 200:
            with open(temp_audio.name, "wb") as f:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        f.write(chunk)
            print(f"Audio generated successfully: {os.path.getsize(temp_audio.name)} bytes")
        else:
            print(f"Murf API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception during speech generation: {e}")

    return temp_audio

def generate_destination_info(place: str, answer_type: str, language: str):
    length_instruction = "around 150-180 words" if answer_type == "Summary" else "around 300-350 words"
    
    prompt = f"""
You are an expert, charismatic tourist guide.
Create an engaging, storytelling travel guide for "{place}" in {language}.

Return a VALID JSON object (do not wrap in markdown quotes if possible) with these keys:
- "tagline": A captivating, poetic one-line subtitle for {place} in {language} (max 10 words).
- "description": The spoken narration guide text ({length_instruction}) in {language}. It must be warm, vivid, and culturally immersive. Do NOT use markdown like asterisks or hashtags because this will be spoken aloud by a text-to-speech voice.
- "bestTime": Best season or time of day to visit in {language} (e.g., "October to March at sunrise").
- "insiderTip": One practical, exciting insider tip for travelers in {language}.
- "highlights": A list of 3 short highlight bullet points in {language}.

Language required: {language}.
Ensure valid JSON output.
"""
    raw_response = call_gemini(prompt).strip()
    
    # Clean potential json fences
    if raw_response.startswith("```json"):
        raw_response = raw_response[7:]
    elif raw_response.startswith("```"):
        raw_response = raw_response[3:]
    if raw_response.endswith("```"):
        raw_response = raw_response[:-3]
    raw_response = raw_response.strip()

    try:
        data = json.loads(raw_response)
        return data
    except Exception as err:
        print("Failed to parse JSON from Gemini, falling back to raw text:", err)
        return {
            "tagline": f"Discover the magic of {place}",
            "description": clean_tts_text(raw_response),
            "bestTime": "Early morning or late afternoon",
            "insiderTip": "Arrive early to avoid large crowds and capture the best natural light.",
            "highlights": ["Iconic architecture", "Deep cultural heritage", "Picturesque viewpoints"]
        }

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "AI Travel Guide Backend is active",
        "version": "2.0.0",
        "models": MODEL_NAMES
    })

@app.route("/generate-audio-guide", methods=["POST"])
def generate_audio_guide():
    try:
        data = request.json or {}
        place = data.get("place", "").strip()
        answer_type = data.get("answerType", "Summary")
        language = data.get("language", "English")
        voice_id = data.get("voiceId", "Matthew")
        locale = data.get("locale", "en-US")

        if not place:
            return jsonify({"error": "Place name is required"}), 400

        print(f"Generating guide for place: {place}, language: {language}, type: {answer_type}")

        info = generate_destination_info(place, answer_type, language)
        text_description = info.get("description", "")

        # Generate audio using Murf
        encoded_audio = ""
        try:
            audio_path = generate_speech(text_description, voice_id, locale)
            if os.path.exists(audio_path.name) and os.path.getsize(audio_path.name) > 0:
                audio_bytes = open(audio_path.name, "rb").read()
                encoded_audio = base64.b64encode(audio_bytes).decode("utf-8")
                try:
                    os.unlink(audio_path.name)
                except Exception:
                    pass
        except Exception as audio_err:
            print("Audio generation fallback note:", audio_err)

        return jsonify({
            "description": text_description,
            "audioBase64": encoded_audio,
            "tagline": info.get("tagline", ""),
            "bestTime": info.get("bestTime", ""),
            "insiderTip": info.get("insiderTip", ""),
            "highlights": info.get("highlights", [])
        })

    except Exception as e:
        print("Error in /generate-audio-guide:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/ask-guide", methods=["POST"])
def ask_guide():
    try:
        data = request.json or {}
        place = data.get("place", "").strip()
        question = data.get("question", "").strip()
        language = data.get("language", "English")

        if not place or not question:
            return jsonify({"error": "Place and question are required"}), 400

        prompt = f"""
You are a warm, knowledgeable personal tour guide at "{place}".
A traveler asks you: "{question}".
Answer in {language} in 2 to 3 concise, friendly sentences.
Be helpful, practical, and enthusiastic.
"""
        answer = call_gemini(prompt).strip()
        return jsonify({"answer": answer})
    except Exception as e:
        print("Error in /ask-guide:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)