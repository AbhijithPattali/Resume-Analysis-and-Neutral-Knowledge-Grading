const uploadBox = document.getElementById('uploadBox');
const chooseFilesBtn = document.getElementById('chooseFilesBtn');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCounter = document.getElementById('fileCounter');
const sendToServerBtn = document.getElementById('sendToServerBtn');

const temporaryFiles = [];
const MAX_FILES = 20;

chooseFilesBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (event) => handleFiles(event.target.files));
sendToServerBtn.addEventListener('click', sendFilesToServer);

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

uploadBox.addEventListener('drop', (event) => {
  const droppedFiles = event.dataTransfer.files;
  handleFiles(droppedFiles);
});

function handleFiles(fileCollection) {
  const files = Array.from(fileCollection);

  // Calculation to check if we exceded the max files limit
  const willBeTotal = temporaryFiles.length + files.length;

  if (willBeTotal > MAX_FILES) {
    alert(`You can upload at most ${MAX_FILES} files in total.`);
    fileInput.value = ""; // reset the input
    return;
  }

  files.forEach((file) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) return;

    temporaryFiles.push({
      name: file.name,
      size: file.size,
      file: file,
    });
  });

  renderFiles();
  updateCounter();
  fileInput.value = '';
}

function updateCounter() {
    fileCounter.textContent = `In this Demo We are accepting only ${temporaryFiles.length}/${MAX_FILES} files`;
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
  } catch (error) {
    console.error('Upload failed:', error);
    alert(`Upload failed: ${error.message}`);
  }
}

updateCounter(); 