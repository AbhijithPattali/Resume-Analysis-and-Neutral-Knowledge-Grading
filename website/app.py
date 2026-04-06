
import io
import json
import re

from flask import Flask, request, send_file
from flask_cors import CORS
from PyPDF2 import PdfReader


# Create the Flask application
app = Flask(__name__)

# Limit the total upload size to 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

# Allow requests from the local frontend during testing
CORS(app, resources={r"/upload-cvs": {"origins": "http://127.0.0.1:5500"}})

# Limit how much extracted PDF text is processed
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
    Clean extracted text and convert it into a list of words.
    """
    safe_text = full_text[:MAX_PRINT_CHARS]

    clean_text = safe_text.translate(str.maketrans('', '', '|-,'))
    clean_text = re.sub(r'(?<!\w)\.|(?<=\w)\.(?!\w)', '', clean_text)

    words = clean_text.split()
    words = [word for word in words if word.strip()]
    was_truncated = len(full_text) > MAX_PRINT_CHARS

    return words, was_truncated


def save_cv_data_to_json(cv_data):
    """
    Save all extracted CV data into list.json.
    Overwrite the file each time the user uploads a new set of CVs.
    """
    with open("list.json", "w", encoding="utf-8") as json_file:
        json_file.write("[\n")

        for index, cv in enumerate(cv_data):
            comma = "," if index < len(cv_data) - 1 else ""

            json_file.write("{\n")
            json_file.write(f'  "filename": {json.dumps(cv["filename"], ensure_ascii=False)},\n')
            json_file.write(f'  "words": {json.dumps(cv["words"], ensure_ascii=False)}\n')
            json_file.write(f"}}{comma}\n")

        json_file.write("]\n")


@app.route("/upload-cvs", methods=["POST"])
def upload_cvs():
    """
    Receive uploaded CV PDFs, extract their text, tokenize the content,
    and save the final result into list.json.
    """
    cv_files = request.files.getlist("cv_files")

    if not cv_files:
        return "No files received", 400

    all_cvs_data = []

    # Process each uploaded PDF file one by one
    for file in cv_files:
        full_text = extract_text_from_pdf(file)
        words, was_truncated = clean_and_split_text(full_text)

        all_cvs_data.append({
            "filename": file.filename,
            "words": words
        })

        if was_truncated:
            print(f'[Output for {file.filename} was truncated because extracted text was too large.]')

    save_cv_data_to_json(all_cvs_data)

    return "CVs processed. Data saved to list.json.", 200


@app.route("/download-json", methods=["GET"])
def download_json():
    """
    Let the user download the generated JSON file.
    """
    return send_file("list.json", as_attachment=True, download_name="list.json")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)