# Resume Ranker Web App

## Overview

Resume Ranker is a local web application developed as part of the **Intelligent Document Profiling System** project. The website allows a recruiter or user to upload multiple PDF CVs, process them into normalized text data, enter recruiter-defined keywords as tags, and receive a ranked list of resumes based on exact keyword matches.

The system was designed as a **privacy-aware prototype**. In the implemented version, the application supports PDF upload, CV text extraction, JSON generation, keyword tag entry, and ranked output presentation through a simple browser interface.

## Main Features

- Upload up to 20 PDF CV files
- Drag-and-drop or file-picker upload support
- Convert uploaded CVs into processed JSON data
- Enter recruiter keywords as tags
- Rank CVs based on exact token matches
- View ranked results directly in the web interface
- Download generated JSON output

## Project Structure

A typical project structure is shown below:

```bash
project-folder/
├── website/
│   ├── app.py
│   ├── list.json (if created)
│   ├── main.html
│   ├── style.css
│   └── script.js
├── .gitignore
├── requiremet.txt
└── ReadMe.md
```

## Requirements

Before running the project, make sure the following are installed on your machine:

- Python 3.13.0
- A modern web browser such as Chrome, Edge, or Firefox

install:

```bash
pip install flask-cors

pip install flask PyPDF2
```

## Setup Guide

Follow these steps to run the website locally.

### 1. Download or clone the project

If using Git:

```bash
git clone https://github.com/AbhijithPattali/Resume-Analysis-and-Neutral-Knowledge-Grading
```

Or simply download the project ZIP file and extract it, then open the extracted folder in your terminal.

### 2. Open the project folder in terminal

Navigate to the root folder that contains the `website` folder.```

### 3. Start the Flask backend

Run the backend using:

```bash
python website/app.py
```

This starts the backend server responsible for:
- receiving uploaded PDF CVs,
- extracting and normalizing text,
- generating the JSON file,
- receiving keyword tags,
- and returning ranked results.

Keep this terminal window open while using the website.

### 4. Start the frontend server

***DO NOT USE LIVE SERVER EXTENTION AS IT WILL BREAKE THE CODE***

Open a **second terminal window** in the same project root folder and run:

```bash
python -m http.server 5500 --directory website
```

This serves the frontend files locally so they can be opened in the browser.

### 5. Open the website in your browser

After starting the frontend server, open:

```text
http://localhost:5500
```

If the `main.html` is inside the `website` folder and served correctly, the web app should load in the browser.

## How to Use the Website

### Phase 1: Upload CVs

1. Open the website in your browser.
2. Upload PDF CV files using either:
   - drag and drop, or
   - the file selection button.
3. Review the uploaded file list.
4. Remove any files if needed before processing.
5. Click the button to continue and process the uploaded CVs.

At this stage, the backend extracts text from the CVs and generates a processed JSON file.

### Phase 2: Enter Recruiter Keywords

1. After processing is complete, proceed to the keyword entry stage.
2. Type keywords into the input field.
3. Press **Enter** to convert each keyword into a tag.
4. Remove tags if needed by clicking on them.
5. Submit the selected tags for ranking.

### Phase 3: View Ranked Results

1. The system compares recruiter tags with the processed CV tokens.
2. CVs are ranked based on the number of exact matching terms.
3. The ranked list is displayed in the interface.
4. You may also download the generated JSON file if needed.

## Notes

- This version of the project is a **prototype** and focuses on exact keyword matching.
- It does **not** currently implement semantic matching, TF-IDF scoring, cosine similarity, or synonym expansion in the final delivered version.
- PDF files are the primary supported format in the implemented system.
- The application is intended for **local academic demonstration and testing** rather than production deployment.


## Closing the App

To stop the application:

- return to each terminal window,
- press `CTRL + C`,
- this will stop both the backend and frontend servers.

## Disclaimer

This website was developed as part of a university dissertation project and is intended for academic use, demonstration, and prototype evaluation.