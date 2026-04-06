
import json
import re

from flask import Flask, request
from flask_cors import CORS
from PyPDF2 import PdfReader
import io

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB max upload
CORS(app, resources={r"/upload-cvs": {"origins": "http://127.0.0.1:5500"}})

MAX_PRINT_CHARS = 10000

@app.route("/upload-cvs", methods=["POST"])
def upload_cvs():
    
    print ()

    cv_files = request.files.getlist("cv_files")

    if not cv_files:
        print("No files received.")
        return "No files received", 400
    
    all_cvs_data = []

    for i, file in enumerate(cv_files):

        file_stream = io.BytesIO(file.read())
        pdf = PdfReader(file_stream)

        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + " "
        
        safe_text = full_text[:MAX_PRINT_CHARS]
        clean_text = safe_text.translate(str.maketrans('', '', '|-,'))
        clean_text = re.sub(r'(?<!\w)\.|(?<=\w)\.(?!\w)', '', clean_text)
        words = clean_text.split()
        all_cvs_data.append({
            "filename": file.filename,
            "words": words
        })

        if len(full_text) > MAX_PRINT_CHARS:
            print("\n[Output truncated because extracted text was too large.]")
   
    for index, cv in enumerate(all_cvs_data):
        comma = "," if index < len(all_cvs_data) - 1 else ""
        print("  {")
        print(f'    "filename": {json.dumps(cv["filename"], ensure_ascii=False)},')
        print(f'    "words": {json.dumps(cv["words"], ensure_ascii=False)}')
        print(f"  }}{comma}")
    
    return "CVs processed. Check terminal for text.", 200

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)