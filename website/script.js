
// Get the main page elements used by the upload interface
const uploadBox = document.getElementById('uploadBox');
const chooseFilesBtn = document.getElementById('chooseFilesBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCounter = document.getElementById('fileCounter');
const sendToServerBtn = document.getElementById('sendToServerBtn');
const jsonDownload = document.getElementById('jsonDownload');
const uploadMessage = document.getElementById('uploadMessage');
const actionsContainer = document.getElementById('actionsContainer');

// Store selected files temporarily in browser memory
const temporaryFiles = [];
const MAX_FILES = 20;

// Button and input event setup
chooseFilesBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (event) => handleFiles(event.target.files));
sendToServerBtn.addEventListener('click', sendFilesToServer);

// Highlight the upload area while files are dragged over it
['dragenter', 'dragover'].forEach((eventName) => {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.add('dragover');
  });
});

// Remove highlight when dragging ends or files are dropped
['dragleave', 'drop'].forEach((eventName) => {
  uploadBox.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadBox.classList.remove('dragover');
  });
});

// Handle files dropped into the upload area
uploadBox.addEventListener('drop', (event) => {
  const droppedFiles = event.dataTransfer.files;
  handleFiles(droppedFiles);
});

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

function updateCounter() {
  fileCounter.textContent =
    `In this demo we are accepting only ${temporaryFiles.length}/${MAX_FILES} files`;
}

function renderFiles() {
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

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';

    // Remove one selected file from the temporary list
    removeBtn.addEventListener('click', () => {
      temporaryFiles.splice(index, 1);
      renderFiles();
      updateCounter();
    });

    row.appendChild(meta);
    row.appendChild(removeBtn);
    fileList.appendChild(row);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
    alert(resultText);

    // Show a download link only if the backend upload succeeded
    if (response.ok) {
      uploadMessage.textContent =
        'CVs uploaded and JSON generated, hit CONTINUE to select the tags.';

      actionsContainer.innerHTML = `
        <button id="continueNextBtn" type="button">Continue Next</button>
        <button id="restartBtn" type="button">Restart</button>
      `;

      jsonDownload.innerHTML = `
        <a href="http://127.0.0.1:5000/download-json" target="_blank">
          Click here to download raw JSON
        </a>
      `;

      const continueNextBtn = document.getElementById('continueNextBtn');
      continueNextBtn.addEventListener('click', () => {
        alert('Next page will be the tag selection screen.');
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

// Show the initial upload counter when the page loads
updateCounter();
