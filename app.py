# genai.configure(api_key="AIzaSyCwg0f8u8re7BFNh4bekbwT3dPVRsfAXfA")

# from flask import Flask, render_template, request, jsonify
# import google.generativeai as genai
# from datetime import datetime

from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import os
import fitz  # PyMuPDF for PDF
import docx
import google.generativeai as genai  # Gemini API
import re
import requests

# Flask setup
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 🔑 Gemini API setup
GEMINI_API_KEY = "AIzaSyCwg0f8u8re7BFNh4bekbwT3dPVRsfAXfA"
genai.configure(api_key=GEMINI_API_KEY)

# 🧠 Global variable to store uploaded knowledge
knowledge_text = ""


# 🧩 Utility: Bold and emoji enhancer
def format_text_with_bold_and_emoji(text):
    # Convert **bold** → <b>bold</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)

    # Add contextual emojis
    emoji_map = {
        r"\b(happy|good|great|awesome|love)\b": "😊",
        r"\b(sad|sorry|unfortunately)\b": "😔",
        r"\b(angry|mad|furious)\b": "😡",
        r"\b(confused|not sure|maybe)\b": "🤔",
        r"\b(hello|hi|hey)\b": "👋",
        r"\b(thank|grateful)\b": "🙏",
        r"\b(excited|amazing|wow)\b": "🤩",
        r"\b(laugh|funny|lol|haha)\b": "😂",
    }

    for pattern, emoji in emoji_map.items():
        text = re.sub(pattern, lambda m: f"{m.group(0)} {emoji}", text, flags=re.IGNORECASE)

    return text


# 🌐 Route: Home
@app.route('/')
def home():
    return render_template('index.html')


# 💬 Route: Chat endpoint
@app.route('/ask', methods=['POST'])
def ask():
    global knowledge_text
    user_message = request.json.get('message', '')

    prompt = f"""
You are a helpful multilingual AI chatbot.
If a knowledge file is uploaded, use its content to answer.
Otherwise, respond normally.
You can reply in the same language as the user's question.

Knowledge (if any):
{knowledge_text}

User: {user_message}
"""

    try:
        model = genai.GenerativeModel("models/gemini-2.5-flash")

        response = model.generate_content(prompt)
        bot_reply = response.text or "Sorry, I couldn’t understand that."
        bot_reply = format_text_with_bold_and_emoji(bot_reply)
        return jsonify({'reply': bot_reply})
    except Exception as e:
        print("❌ Gemini Error:", e)
        return jsonify({'reply': "⚠️ Error generating response!"})


# 🎭 Route: Emotion Detection
@app.route('/detect_emotion', methods=['POST'])
def detect_emotion():
    text = request.json.get("text", "")

    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

    prompt = f"""
    Enhance this chatbot message by naturally adding fitting emojis throughout the text.
    Message: "{text}"
    """

    payload = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}

    try:
        response = requests.post(url, json=payload)
        data = response.json()
        enhanced_text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        ).strip()

        enhanced_text = format_text_with_bold_and_emoji(enhanced_text)
        return jsonify({"reply": enhanced_text})

    except Exception:
        return jsonify({"reply": format_text_with_bold_and_emoji(text)})


# 📂 Route: File Upload (PDF / DOCX)
@app.route('/upload_file', methods=['POST'])
def upload_file():
    global knowledge_text
    file = request.files.get('file')
    if not file:
        return jsonify({'success': False, 'error': 'No file provided'})

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Extract text from file
    ext = filename.lower().split('.')[-1]
    extracted_text = ""
    try:
        if ext == "pdf":
            with fitz.open(filepath) as pdf:
                for page in pdf:
                    extracted_text += page.get_text()
        elif ext == "docx":
            doc = docx.Document(filepath)
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
        else:
            return jsonify({'success': False, 'error': 'Unsupported file type'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to extract text: {e}'})

    # Save extracted knowledge
    knowledge_text = extracted_text
    print("✅ Knowledge uploaded and extracted successfully!")
    return jsonify({'success': True})


# 🚀 Run the app
if __name__ == '__main__':
    app.run(debug=True)

# Available Model Checking
# ===========================================

# import google.generativeai as genai

# genai.configure(api_key="AIzaSyCwg0f8u8re7BFNh4bekbwT3dPVRsfAXfA")

# print("Available models:\n")
# for m in genai.list_models():
#     print(m.name)
