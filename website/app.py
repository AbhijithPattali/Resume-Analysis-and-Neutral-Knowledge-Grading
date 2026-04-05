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
    print("\n" + "=" * 60)
    print("RECEIVED UPLOADED CVs")
    print("=" * 60 + "\n")

    cv_files = request.files.getlist("cv_files")

    if not cv_files:
        print("No files received.")
        return "No files received", 400

    for i, file in enumerate(cv_files):
        print(f"\nCV {i+1}: {file.filename}")
        print("-" * 40)

        file_stream = io.BytesIO(file.read())
        pdf = PdfReader(file_stream)

        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + " "

        print("Extracted text:\n")
        
        safe_text = full_text[:MAX_PRINT_CHARS]
        clean_text = safe_text.translate(str.maketrans('', '', '|-,'))
        clean_text = re.sub(r'(?<!\w)\.|(?<=\w)\.(?!\w)', '', clean_text)
        words = clean_text.split()
        formatted_text = "{" + ", ".join(words) + "}"
        
        print(formatted_text)
        
        if len(full_text) > MAX_PRINT_CHARS:
            print("\n[Output truncated because extracted text was too large.]")
        
        print("\n" + "-" * 40)

    return "CVs processed. Check terminal for text.", 200

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)