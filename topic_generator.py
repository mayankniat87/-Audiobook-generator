
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_text_for_topic(topic: str) -> str:
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = (
            f"Write an engaging, audiobook-style narration about: '{topic}'. "
            "Write approximately 400-500 words of flowing prose suitable for text-to-speech. "
            "No headers, bullet points, or markdown — just natural flowing narration."
        )
        
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"[Topic Generator] Error: {e}")
        return ""