import os
import requests
from dotenv import load_dotenv

load_dotenv()

MURF_API_KEY = os.getenv("MURF_API_KEY")
MURF_API_URL = "https://api.murf.ai/v1/speech/generate"
OUTPUT_FOLDER = "outputs"


def text_to_speech(text: str, voice_id: str = "en-US-natalie", output_filename: str = "output.mp3") -> str | None:
    """
    Send text to Murf AI and save the returned audio as an MP3.
    Returns the path to the saved audio file, or None on failure.
    """
    if not MURF_API_KEY:
        print("[Murf] ERROR: MURF_API_KEY is not set in .env")
        return None

    headers = {
        "Content-Type": "application/json",
        "api-key": MURF_API_KEY,         # ← YOUR MURF API KEY IS USED HERE
    }

    payload = {
        "voiceId": voice_id,
        "style": "Conversational",
        "text": text,
        "rate": 0,       # Speed: -50 (slow) to 50 (fast), 0 = default
        "pitch": 0,      # Pitch: -50 to 50, 0 = default
        "sampleRate": 24000,
        "format": "MP3",
        "channelType": "MONO",
        "encodeAsBase64": False,
    }

    try:
        response = requests.post(MURF_API_URL, headers=headers, json=payload, timeout=60)

        if response.status_code != 200:
            print(f"[Murf] API error {response.status_code}: {response.text}")
            return None

        data = response.json()

        # Murf returns the audio URL in the response
        audio_url = data.get("audioFile")
        if not audio_url:
            print("[Murf] No audio URL in response")
            return None

        # Download the audio file
        audio_response = requests.get(audio_url, timeout=60)
        if audio_response.status_code != 200:
            print("[Murf] Failed to download audio file")
            return None

        # Save to disk
        safe_filename = "".join(c if c.isalnum() or c in "._-" else "_" for c in output_filename)
        output_path = os.path.join(OUTPUT_FOLDER, safe_filename)
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)

        with open(output_path, "wb") as f:
            f.write(audio_response.content)

        print(f"[Murf] Audio saved to {output_path}")
        return output_path

    except Exception as e:
        print(f"[Murf] Exception: {e}")
        return None
