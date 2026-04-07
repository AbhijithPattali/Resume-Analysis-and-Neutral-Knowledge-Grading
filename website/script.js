// =========================================================
// DOM REFERENCES
// ---------------------------------------------------------
// Main elements used across phase 1 (upload) and the
// ranked-results area.
// =========================================================
const uploadBox = document.getElementById('uploadBox');
const chooseFilesBtn = document.getElementById('chooseFilesBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCounter = document.getElementById('fileCounter');
const sendToServerBtn = document.getElementById('sendToServerBtn');
const jsonDownload = document.getElementById('jsonDownload');
const uploadMessage = document.getElementById('uploadMessage');
const actionsContainer = document.getElementById('actionsContainer');
const fileSectionTitle = document.getElementById('fileSectionTitle');


// =========================================================
// TEMPORARY FRONTEND STATE
// ---------------------------------------------------------
// temporaryFiles stores uploaded PDF files before sending
// them to Flask.
// temporaryTags stores user-entered keyword tags.
// =========================================================
const temporaryFiles = [];
const temporaryTags = [];
const MAX_FILES = 20;


// =========================================================
// INITIAL EVENT BINDINGS
// ---------------------------------------------------------
// Set up upload button, file input, and phase 1 Continue.
// =========================================================
chooseFilesBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (event) => handleFiles(event.target.files));
sendToServerBtn.addEventListener('click', sendFilesToServer);


// =========================================================
// DRAG AND DROP UI FEEDBACK
// ---------------------------------------------------------
// Add/remove highlight state while dragging files over the
// upload area.
// =========================================================
['dragenter', 'dragover'].forEach((eventName) => {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.remove('dragover');
  });
});


// =========================================================
// FILE DROP HANDLER
// ---------------------------------------------------------
// Accept dropped files and route them through the same file
// processing logic as manual file selection.
// =========================================================
uploadBox.addEventListener('drop', (event) => {
  const droppedFiles = event.dataTransfer.files;
  handleFiles(droppedFiles);
});


// =========================================================
// FILE HANDLING
// ---------------------------------------------------------
// Validate files, enforce the file limit, accept only PDFs,
// and store them temporarily in browser memory.
// =========================================================
function handleFiles(fileCollection) {
  const files = Array.from(fileCollection);
  const totalAfterUpload = temporaryFiles.length + files.length;

  // Stop the user if the total file count would exceed the limit
  if (totalAfterUpload > MAX_FILES) {
    alert(`You can upload at most ${MAX_FILES} files in total.`);
    fileInput.value = '';
    return;
  }

  // Accept only PDF files
  files.forEach((file) => {
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) return;

    temporaryFiles.push({
      name: file.name,
      size: file.size,
      file: file
    });
  });

  renderFiles();
  updateCounter();
  fileInput.value = '';
}


// =========================================================
// FILE COUNTER
// ---------------------------------------------------------
// Update the visible x/20 upload count shown in phase 1.
// =========================================================
function updateCounter() {
  fileCounter.textContent =
    `In this demo we are accepting only ${temporaryFiles.length}/${MAX_FILES} files`;
}


// =========================================================
// FILE LIST RENDERER
// ---------------------------------------------------------
// Render selected files into the list area.
// Current behavior:
// - showRemoveButton = true  -> phase 1 editable list
// - showRemoveButton = false -> phase 2 locked list
// =========================================================
function renderFiles(showRemoveButton = true) {
  if (temporaryFiles.length === 0) {
    fileList.className = 'empty';
    fileList.textContent = 'No files uploaded yet.';
    return;
  }

  fileList.className = '';
  fileList.innerHTML = '';

  temporaryFiles.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'file-item';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <div><strong>${escapeHtml(item.name)}</strong></div>
      <div class="small">${formatBytes(item.size)} | Temporary index: ${index}</div>
    `;

    row.appendChild(meta);

    if (showRemoveButton) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';

      removeBtn.addEventListener('click', () => {
        temporaryFiles.splice(index, 1);
        renderFiles(true);
        updateCounter();
      });

      row.appendChild(removeBtn);
    }

    fileList.appendChild(row);
  });
}


// =========================================================
// HELPER: BYTE FORMATTER
// ---------------------------------------------------------
// Convert raw file size bytes into readable KB/MB text.
// =========================================================
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


// =========================================================
// HELPER: HTML ESCAPER
// ---------------------------------------------------------
// Safely render user-facing text into the DOM.
// =========================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// =========================================================
// PHASE 2: TAG ENTRY SCREEN
// ---------------------------------------------------------
// Replace the upload box contents with the tag-entry UI.
// Current behavior:
// - User types one or more words
// - Pressing Enter creates separate tags
// - Clicking Continue sends tags to Flask
// =========================================================
function renderTagPhase() {
  uploadBox.innerHTML = `
    <p id="uploadMessage">Enter keywords for matching. Press Enter to turn a word into a tag. \n To remove a tag click on it.</p>

    <div id="tagInputBox" class="tag-input-box">
      <input
        id="tagTextInput"
        type="text"
        placeholder="Type a keyword like Programmer and press Enter"
        autocomplete="off"
      />
      <div id="tagList" class="tag-list"></div>
    </div>

    <div id="actionsContainer" class="actions">
      <button id="tagContinueBtn" type="button">Continue</button>
      <button id="tagRestartBtn" type="button">Restart</button>
    </div>

    <p class="small">Example: Programmer, CSS, Python, HTML, JavaScript.</p>
  `;

  const tagTextInput = document.getElementById('tagTextInput');
  const tagContinueBtn = document.getElementById('tagContinueBtn');
  const tagRestartBtn = document.getElementById('tagRestartBtn');

  renderTags();

  // Press Enter to convert text into one or more separate tags
  tagTextInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      const value = tagTextInput.value.trim();
      if (!value) return;

      const splitTags = value
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      splitTags.forEach((singleTag) => {
        const alreadyExists = temporaryTags.some(
          (tag) => tag.toLowerCase() === singleTag.toLowerCase()
        );

        if (!alreadyExists) {
          temporaryTags.push(singleTag);
        }
      });

      renderTags();
      tagTextInput.value = '';
    }
  });

  // Send tags to backend for exact token matching
  tagContinueBtn.addEventListener('click', async () => {
    if (temporaryTags.length === 0) {
      alert('Please add at least one tag first.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/submit-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags: temporaryTags })
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Tag comparison failed.');
        return;
      }

      renderRankedResults(result.ranked_results);
      // alert(result.message);

    } catch (error) {
      console.error('Failed to send tags:', error);
      alert('Failed to send tags to server.');
    }
  });

  tagRestartBtn.addEventListener('click', () => {
    window.location.reload();
  });
}


// =========================================================
// TAG RENDERER
// ---------------------------------------------------------
// Render all current tags as clickable pills.
// Clicking a tag removes it.
// =========================================================
function renderTags() {
  const tagList = document.getElementById('tagList');
  if (!tagList) return;

  tagList.innerHTML = '';

  temporaryTags.forEach((tag, index) => {
    const tagButton = document.createElement('button');
    tagButton.type = 'button';
    tagButton.className = 'tag-pill';
    tagButton.textContent = tag;

    tagButton.addEventListener('click', () => {
      temporaryTags.splice(index, 1);
      renderTags();
    });

    tagList.appendChild(tagButton);
  });
}


// =========================================================
// RANKED RESULTS RENDERER
// ---------------------------------------------------------
// Replace the original uploaded-file list with ranked CV
// results returned from Flask.
// Current behavior:
// - Changes heading to "Ranked List"
// - Shows filename, match count, and matched tokens
// =========================================================
function renderRankedResults(rankedResults) {
  if (fileSectionTitle) {
    fileSectionTitle.textContent = 'Ranked List';
  }

  if (!rankedResults || rankedResults.length === 0) {
    fileList.className = 'empty';
    fileList.textContent = 'No ranked results available.';
    return;
  }

  fileList.className = '';
  fileList.innerHTML = '';

  rankedResults.forEach((result, index) => {
    const row = document.createElement('div');
    row.className = 'file-item';

    const meta = document.createElement('div');
    meta.className = 'meta';

    meta.innerHTML = `
      <div><strong>${index + 1}. ${escapeHtml(result.filename)}</strong></div>
      <div class="small">Match count: ${result.match_count}</div>
      <div class="small">Matched tokens: ${result.matched_tokens.length ? escapeHtml(result.matched_tokens.join(', ')) : 'No exact matches'}</div>
    `;

    row.appendChild(meta);
    fileList.appendChild(row);
  });
}


// =========================================================
// PHASE 1: SEND FILES TO BACKEND
// ---------------------------------------------------------
// Upload selected PDFs to Flask, lock the file list, and
// transition the interface into the next stage.
// =========================================================
async function sendFilesToServer() {
  if (temporaryFiles.length === 0) {
    alert('Please add at least one CV first.');
    return;
  }

  const formData = new FormData();

  // Add each selected PDF file to the request body
  temporaryFiles.forEach((item) => {
    formData.append('cv_files', item.file);
  });

  try {
    const response = await fetch('http://127.0.0.1:5000/upload-cvs', {
      method: 'POST',
      body: formData
    });

    const resultText = await response.text();
    // alert(resultText);

    // Show phase 2 controls only if backend upload succeeded
    if (response.ok) {
      uploadMessage.textContent =
        'CVs uploaded and JSON generated, hit PROCEED to select the tags.';

      renderFiles(false);

      actionsContainer.innerHTML = `
        <button id="proceedBtn" type="button">Proceed</button>
        <button id="restartBtn" type="button">Restart</button>
      `;

      jsonDownload.innerHTML = `
        <a href="http://127.0.0.1:5000/download-json" target="_blank">
          Click here to download raw JSON
        </a>
      `;

      const proceedBtn = document.getElementById('proceedBtn');
      proceedBtn.addEventListener('click', () => {
        renderTagPhase();
      });

      const restartBtn = document.getElementById('restartBtn');
      restartBtn.addEventListener('click', () => {
        window.location.reload();
      });

    } else {
      jsonDownload.textContent = '';
    }

  } catch (error) {
    console.error('Upload failed:', error);
    jsonDownload.textContent = '';
  }
}


// =========================================================
// INITIAL PAGE STATE
// ---------------------------------------------------------
// Show the starting file counter on first page load.
// =========================================================
updateCounter();