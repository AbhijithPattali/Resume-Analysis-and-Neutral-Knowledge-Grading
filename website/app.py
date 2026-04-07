import io
import json
import re
import os

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader


# =========================================================
# APP SETUP
# ---------------------------------------------------------
# Create the Flask application and configure request limits.
# =========================================================
app = Flask(__name__)

# Limit the total upload size to 5 MB
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

# Allow requests from the local frontend during testing
CORS(app, resources={
    r"/upload-cvs": {"origins": "http://127.0.0.1:5500"},
    r"/submit-tags": {"origins": "http://127.0.0.1:5500"}
})


# =========================================================
# GLOBAL SETTINGS
# ---------------------------------------------------------
# MAX_PRINT_CHARS limits how much extracted PDF text is
# processed per file.
# BASE_DIR and JSON_FILE_PATH keep file paths stable even if
# the server is started from outside the project folder.
# =========================================================
MAX_PRINT_CHARS = 10000

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE_PATH = os.path.join(BASE_DIR, "list.json")


# =========================================================
# PDF TEXT EXTRACTION
# ---------------------------------------------------------
# Read uploaded PDF files and combine text from all pages.
# =========================================================
def extract_text_from_pdf(uploaded_file):
    """
    Read one uploaded PDF file and return all extracted text
    as one string.
    """
    file_stream = io.BytesIO(uploaded_file.read())
    pdf = PdfReader(file_stream)

    full_text = ""
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            full_text += text + " "

    return full_text


# =========================================================
# TEXT NORMALIZATION
# ---------------------------------------------------------
# Normalize text so CV tokens and user tags follow the same
# format before matching.
#
# Current behavior:
# - Convert to lowercase
# - Trim leading/trailing spaces
# - Replace punctuation with spaces
# - Collapse repeated whitespace
# =========================================================
def normalize_text(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    text = " ".join(text.split())
    return text


def clean_and_split_text(full_text):
    """
    Normalize extracted CV text and convert it into a list
    of tokens.
    """
    safe_text = full_text[:MAX_PRINT_CHARS]
    normalized_text = normalize_text(safe_text)

    words = normalized_text.split()
    was_truncated = len(full_text) > MAX_PRINT_CHARS

    return words, was_truncated


def normalize_tag_text(text):
    """
    Normalize tag input using the same logic as CV text so
    both sides are comparable.
    """
    return normalize_text(text)


# =========================================================
# JSON STORAGE
# ---------------------------------------------------------
# Save processed CV data into list.json.
#
# Current behavior:
# - Overwrites the JSON file for each new upload batch
# - Stores filename and normalized token list for each CV
# =========================================================
def save_cv_data_to_json(cv_data):
    """
    Save all extracted CV data into list.json.
    Overwrite the file each time the user uploads a new set
    of CVs.
    """
    with open(JSON_FILE_PATH, "w", encoding="utf-8") as json_file:
        json_file.write("[\n")

        for index, cv in enumerate(cv_data):
            comma = "," if index < len(cv_data) - 1 else ""

            json_file.write("{\n")
            json_file.write(f'  "filename": {json.dumps(cv["filename"], ensure_ascii=False)},\n')
            json_file.write(f'  "words": {json.dumps(cv["words"], ensure_ascii=False)}\n')
            json_file.write(f"}}{comma}\n")

        json_file.write("]\n")


def load_cv_data_from_json():
    """
    Load previously saved CV data from list.json.
    Return an empty list if the file does not exist yet.
    """
    if not os.path.exists(JSON_FILE_PATH):
        return []

    with open(JSON_FILE_PATH, "r", encoding="utf-8") as json_file:
        return json.load(json_file)


# =========================================================
# ROUTE: UPLOAD CVS
# ---------------------------------------------------------
# Receive PDF files from the frontend, extract text, convert
# it into normalized tokens, and save the results to JSON.
# =========================================================
@app.route("/upload-cvs", methods=["POST"])
def upload_cvs():
    """
    Receive uploaded CV PDFs, extract their text, tokenize
    the content, and save the final result into list.json.
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
            print(f"[Output for {file.filename} was truncated because extracted text was too large.]")

    save_cv_data_to_json(all_cvs_data)

    return "CVs processed. Data saved to list.json.", 200


# =========================================================
# ROUTE: SUBMIT TAGS
# ---------------------------------------------------------
# Receive tags from the frontend, normalize them, compare
# them against each CV's token list, and rank the files from
# most matches to least matches.
#
# Current behavior:
# - Exact match only
# - No synonym expansion yet
# - Returns ranked results as JSON for frontend display
# =========================================================
@app.route("/submit-tags", methods=["POST"])
def submit_tags():
    data = request.get_json() or {}
    raw_tags = data.get("tags", [])

    normalized_tag_tokens = set()

    # Normalize all submitted tags and flatten them into
    # individual tokens for exact matching
    for tag in raw_tags:
        clean_tag = normalize_tag_text(tag)
        if not clean_tag:
            continue

        for token in clean_tag.split():
            normalized_tag_tokens.add(token)

    if not normalized_tag_tokens:
        return jsonify({
            "message": "No valid tags received."
        }), 400

    cv_data = load_cv_data_from_json()

    if not cv_data:
        return jsonify({
            "message": "No CV data found. Please upload CVs first."
        }), 400

    ranked_results = []

    # Compare the submitted tag tokens against every CV
    for cv in cv_data:
        filename = cv.get("filename", "Unknown file")
        cv_words = cv.get("words", [])

        cv_token_set = set(cv_words)
        matched_tokens = sorted(normalized_tag_tokens.intersection(cv_token_set))
        match_count = len(matched_tokens)

        ranked_results.append({
            "filename": filename,
            "match_count": match_count,
            "matched_tokens": matched_tokens
        })

    # Rank from highest match count to lowest
    ranked_results.sort(key=lambda item: item["match_count"], reverse=True)

    # Debug output in terminal for development/testing
    print("\n========== CV MATCH RESULTS ==========")
    print("Submitted tag tokens:", sorted(normalized_tag_tokens))
    print()

    for index, result in enumerate(ranked_results, start=1):
        print(f"{index}. {result['filename']}")
        print(f"   Match count: {result['match_count']}")
        print(f"   Matched tokens: {result['matched_tokens']}")
        print()

    print("======================================\n")

    return jsonify({
        "message": "Tags compared successfully.",
        "ranked_results": ranked_results
    })


# =========================================================
# ROUTE: DOWNLOAD JSON
# ---------------------------------------------------------
# Allow the frontend/user to download the generated JSON
# file containing processed CV token data.
# =========================================================
@app.route("/download-json", methods=["GET"])
def download_json():
    """
    Let the user download the generated JSON file.
    """
    return send_file(JSON_FILE_PATH, as_attachment=True, download_name="list.json")


# =========================================================
# APP ENTRY POINT
# ---------------------------------------------------------
# Run the local development server.
# =========================================================
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)