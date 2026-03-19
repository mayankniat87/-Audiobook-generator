from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from pdf_parser import extract_text_from_pdf
from topic_generator import generate_text_for_topic
from murf_service import text_to_speech

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/pdf-to-audio", methods=["POST"])
def pdf_to_audio():
    """Upload a PDF and get back an audiobook."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    voice_id = request.form.get("voice_id", "en-US-natalie")

    if file.filename == "" or not file.filename.endswith(".pdf"):
        return jsonify({"error": "Please upload a valid PDF file"}), 400

    # Save PDF
    pdf_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(pdf_path)

    # Extract text
    text = extract_text_from_pdf(pdf_path)
    if not text:
        return jsonify({"error": "Could not extract text from PDF"}), 500

    # Convert to audio via Murf
    audio_path = text_to_speech(text, voice_id, output_filename=f"{file.filename}.mp3")
    if not audio_path:
        return jsonify({"error": "Audio generation failed"}), 500

    return send_file(audio_path, mimetype="audio/mpeg", as_attachment=True, download_name="audiobook.mp3")


@app.route("/api/topic-to-audio", methods=["POST"])
def topic_to_audio():
    """Take a topic string, generate content, and return audio."""
    data = request.get_json()
    topic = data.get("topic", "").strip()
    voice_id = data.get("voice_id", "en-US-natalie")

    if not topic:
        return jsonify({"error": "No topic provided"}), 400

    # Generate text content about the topic
    text = generate_text_for_topic(topic)
    if not text:
        return jsonify({"error": "Content generation failed"}), 500

    # Convert to audio via Murf
    audio_path = text_to_speech(text, voice_id, output_filename=f"{topic[:30]}.mp3")
    if not audio_path:
        return jsonify({"error": "Audio generation failed"}), 500

    return send_file(audio_path, mimetype="audio/mpeg", as_attachment=True, download_name="audiobook.mp3")


@app.route("/api/voices", methods=["GET"])
def get_voices():
    """Return a list of available Murf voices."""
    voices = [
        {"id": "en-US-natalie", "name": "Natalie", "language": "English (US)", "gender": "Female"},
        {"id": "en-US-marcus",  "name": "Marcus",  "language": "English (US)", "gender": "Male"},
        {"id": "en-UK-hazel",   "name": "Hazel",   "language": "English (UK)", "gender": "Female"},
        {"id": "en-UK-oliver",  "name": "Oliver",  "language": "English (UK)", "gender": "Male"},
        {"id": "en-IN-aarav",   "name": "Aarav",   "language": "English (IN)", "gender": "Male"},
        {"id": "en-IN-priya",   "name": "Priya",   "language": "English (IN)", "gender": "Female"},
    ]
    return jsonify({"voices": voices})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
