import io
import json
import re

from flask import Flask, request
from flask_cors import CORS
from PyPDF2 import PdfReader

# Create the Flask app
app = Flask(__name__)

# Limit total upload size to 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

# Allow requests only from the local frontend used in testing
CORS(app, resources={r"/upload-cvs": {"origins": "http://127.0.0.1:5500"}})

# Limit how much extracted text is processed from each PDF
MAX_PRINT_CHARS = 10000


def extract_text_from_pdf(uploaded_file):
    """
    Read one uploaded PDF file and return all extracted text as one string.
    """
    file_stream = io.BytesIO(uploaded_file.read())
    pdf = PdfReader(file_stream)

    full_text = ""
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            full_text += text + " "

    return full_text


def clean_and_split_text(full_text):
    """
    Clean the extracted text and convert it into a list of words.

    Rules used:
    - Limit the amount of text processed.
    - Remove | , - and comma characters.
    - Remove dots only when they are not between word characters.
    - Split the final text into words.
    """
    safe_text = full_text[:MAX_PRINT_CHARS]

    clean_text = safe_text.translate(str.maketrans('', '', '|-,'))
    clean_text = re.sub(r'(?<!\w)\.|(?<=\w)\.(?!\w)', '', clean_text)

    words = clean_text.split()
    was_truncated = len(full_text) > MAX_PRINT_CHARS

    return words, was_truncated


def print_cv_data_as_json(cv_data):
    """
    Print the extracted CV data in a JSON-like layout where:
    - each CV object is on its own block,
    - the words list stays on one line.
    """
    print("[")

    for index, cv in enumerate(cv_data):
        comma = "," if index < len(cv_data) - 1 else ""

        print("  {")
        print(f'    "filename": {json.dumps(cv["filename"], ensure_ascii=False)},')
        print(f'    "words": {json.dumps(cv["words"], ensure_ascii=False)}')
        print(f"  }}{comma}")

    print("]")


@app.route("/upload-cvs", methods=["POST"])
def upload_cvs():
    """
    Receive uploaded CV PDFs from the website,
    extract words from each file,
    and print the result in JSON-style format.
    """

    cv_files = request.files.getlist("cv_files")

    if not cv_files:
        print("No files received.")
        return "No files received", 400

    all_cvs_data = []

    for file in cv_files:
        full_text = extract_text_from_pdf(file)
        words, was_truncated = clean_and_split_text(full_text)

        all_cvs_data.append({
            "filename": file.filename,
            "words": words
        })

        if was_truncated:
            print(f'[Output for {file.filename} was truncated because extracted text was too large.]')

    print_cv_data_as_json(all_cvs_data)

    return "CVs processed. Check terminal for text.", 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)