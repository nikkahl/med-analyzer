debugger; // Для відладки

let myChart = null;
let globalHistoryData = [];
let cameraStream = null;
let capturedPhotoBlob = null;
let currentUploadMode = 'file';


async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
        forceLogout();
        throw new Error('Сесія закінчилася. Увійдіть знову.');
    }
    return response;
}

function forceLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const emailDisplay = document.getElementById('userEmailDisplay');
if (emailDisplay) emailDisplay.innerText = 'Користувач';

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', forceLogout);

const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const fileContainer = document.getElementById('fileUploadContainer');
const fileInput = document.getElementById('analysisFile');
const dropArea = document.getElementById('dropArea');
const cameraContainer = document.getElementById('cameraUploadContainer');
const videoFeed = document.getElementById('cameraFeed');
const canvas = document.getElementById('cameraCanvas');
const photoPreview = document.getElementById('capturedImagePreview');
const startCameraBtn = document.getElementById('startCameraBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const retakePhotoBtn = document.getElementById('retakePhotoBtn');
const cameraError = document.getElementById('cameraError');
const modeFileBtn = document.getElementById('modeFileBtn');
const modeCameraBtn = document.getElementById('modeCameraBtn');

if (modeFileBtn) modeFileBtn.addEventListener('click', () => switchMode('file'));
if (modeCameraBtn) modeCameraBtn.addEventListener('click', () => switchMode('camera'));

function switchMode(mode) {
    currentUploadMode = mode;
    if (uploadStatus) uploadStatus.classList.add('hidden');
    
    if (mode === 'file') {
        modeFileBtn.classList.add('active'); 
        modeCameraBtn.classList.remove('active');
        fileContainer.classList.remove('hidden'); 
        cameraContainer.classList.add('hidden');
        stopCamera();
    } else {
        modeCameraBtn.classList.add('active'); 
        modeFileBtn.classList.remove('active');
        cameraContainer.classList.remove('hidden'); 
        fileContainer.classList.add('hidden');
        
        if (!capturedPhotoBlob) {
         startCameraBtn.classList.remove('hidden');
         videoFeed.classList.add('hidden');
        }
    }
    checkUploadReadiness();
}

if (dropArea) {
    ['dragenter', 'dragover'].forEach(evt => dropArea.addEventListener(evt, (e) => { e.preventDefault(); dropArea.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(evt => dropArea.addEventListener(evt, (e) => { e.preventDefault(); dropArea.classList.remove('dragover'); }));
    dropArea.addEventListener('drop', (e) => { fileInput.files = e.dataTransfer.files; handleFiles(); });
}
if (fileInput) fileInput.addEventListener('change', handleFiles);

function handleFiles() {
    if (fileInput.files.length > 0 && dropArea && dropArea.querySelector('.file-msg')) {
        dropArea.querySelector('.file-msg').innerText = `Вибрано файл: ${fileInput.files[0].name}`;
    }
    checkUploadReadiness();
}

if (startCameraBtn) startCameraBtn.addEventListener('click', async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        videoFeed.srcObject = cameraStream;
        videoFeed.classList.remove('hidden'); startCameraBtn.classList.add('hidden'); takePhotoBtn.classList.remove('hidden'); cameraError.classList.add('hidden');
    } catch (err) {
        cameraError.innerText = 'Не вдалося отримати доступ до камери.'; cameraError.classList.remove('hidden');
    }
});

if (takePhotoBtn) takePhotoBtn.addEventListener('click', () => {
    canvas.width = videoFeed.videoWidth; canvas.height = videoFeed.videoHeight;
    canvas.getContext('2d').drawImage(videoFeed, 0, 0);
    canvas.toBlob((blob) => {
        capturedPhotoBlob = blob;
        photoPreview.src = URL.createObjectURL(blob);
        photoPreview.classList.remove('hidden'); videoFeed.classList.add('hidden');
        takePhotoBtn.classList.add('hidden'); retakePhotoBtn.classList.remove('hidden');
        stopCamera(); checkUploadReadiness();
    }, 'image/jpeg', 0.95);
});

if (retakePhotoBtn) retakePhotoBtn.addEventListener('click', () => {
    capturedPhotoBlob = null; photoPreview.classList.add('hidden'); photoPreview.src = '';
    retakePhotoBtn.classList.add('hidden'); startCameraBtn.click(); checkUploadReadiness();
});

function stopCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach(track => track.stop()); cameraStream = null; }
}

function checkUploadReadiness() {
    let isReady = currentUploadMode === 'file' ? fileInput.files.length > 0 : capturedPhotoBlob !== null;
    if (uploadBtn) uploadBtn.disabled = !isReady;
}

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (currentUploadMode === 'file') {
            if (fileInput.files.length === 0) return;
            formData.append('analysisImage', fileInput.files[0]);
        } else {
            if (!capturedPhotoBlob) return;
            formData.append('analysisImage', capturedPhotoBlob, 'camera-capture.jpg');
        }

        uploadBtn.disabled = true;
        showStatus('Обробка та розпізнавання...', 'loading');

        try {
            const res = await authFetch('/api/analyses/upload', { method: 'POST', body: formData });
            const result = await res.json();
            if (res.ok) {
                showStatus('Успішно!', 'success');
                displayResultWithNorms(result.data);
                loadHistoryInitial();
                resetUploadForm();
            } else { throw new Error(result.message || 'Помилка'); }
        } catch (err) {
            if (err.message !== 'Сесія закінчилася. Увійдіть знову.') showStatus(err.message, 'error');
        } finally { uploadBtn.disabled = false; checkUploadReadiness(); }
    });
}

function resetUploadForm() {
    uploadForm.reset();
    if (dropArea && dropArea.querySelector('.file-msg')) dropArea.querySelector('.file-msg').innerText = 'Перетягніть файл...';
    capturedPhotoBlob = null; photoPreview.classList.add('hidden'); photoPreview.src = '';
    retakePhotoBtn.classList.add('hidden'); startCameraBtn.classList.remove('hidden'); videoFeed.classList.add('hidden');
    stopCamera(); checkUploadReadiness();
}

function showStatus(message, type) {
    if (!uploadStatus) return;
    uploadStatus.innerText = message;
    uploadStatus.className = `status-message ${type}`;
    uploadStatus.classList.remove('hidden');
}
let currentAnalysisId = null; 

function displayResultWithNorms(data) {
    const resultSection = document.getElementById('resultSection');
    const indicatorsList = document.getElementById('parsedIndicatorsList');
    const rawTextDisplay = document.getElementById('rawOcrTextDisplay');
    
    if (!resultSection || !indicatorsList) return;
    
    currentAnalysisId = data._id; 

    resultSection.classList.remove('hidden');
    indicatorsList.innerHTML = '';

    if (!data.indicators || data.indicators.length === 0) {
        indicatorsList.innerHTML = '<li style="padding:1rem; text-align:center;">Показників не знайдено.</li>';
        return;
    }

    data.indicators.forEach(ind => {
        const li = document.createElement('li');
        li.className = 'indicator-item';
        li.id = `indicator-row-${ind._id}`; 

        const val = parseFloat(ind.value);
        const min = parseFloat(ind.referenceMin);
        const max = parseFloat(ind.referenceMax);
        const units = ind.units || '';
        const statusInfo = getStatusInfo(val, min, max);

        li.innerHTML = `
            <div class="indicator-info">
                <span class="indicator-name">${ind.name}</span>
                <span class="indicator-range">${statusInfo.rangeText} ${units}</span>
            </div>
            
            <div class="indicator-result">
                <div class="view-mode" id="view-${ind._id}">
                    <span class="value-text ${statusInfo.className}" id="val-text-${ind._id}">${ind.value} <small>${units}</small></span>
                    ${statusInfo.text ? `<span class="status-badge ${statusInfo.className}" id="badge-${ind._id}">${statusInfo.text}</span>` : ''}
                    
                    <div class="edit-controls">
                        <button onclick="enableEditMode('${ind._id}')" class="btn-icon-small" title="Редагувати">
                            редагувати
                        </button>
                    </div>
                </div>

                <div class="edit-mode hidden" id="edit-${ind._id}" style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" class="edit-input" id="input-${ind._id}" value="${ind.value}" step="0.1">
                    <button onclick="saveIndicatorValue('${ind._id}')" class="btn-icon-small" style="color: green;" title="Зберегти">
                        зберегти
                    </button>
                    <button onclick="cancelEditMode('${ind._id}')" class="btn-icon-small" style="color: red;" title="Скасувати">
                        відмінити
                    </button>
                </div>
            </div>
        `;

        indicatorsList.appendChild(li);
    });
    
    if (rawTextDisplay) rawTextDisplay.innerText = data.rawOcrText || '';
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

function getStatusInfo(val, min, max) {
    const hasNorms = !isNaN(min) && !isNaN(max);
    if (!hasNorms) {
        return { className: 'status-neutral', text: '', rangeText: 'Норма не вказана' };
    }

    let className = 'status-ok';
    let text = 'В НОРМІ';

    if (val < min) {
        className = 'status-warning';
        text = '↓ НИЗЬКИЙ';
    } else if (val > max) {
        className = 'status-warning';
        text = '↑ ВИСОКИЙ';
    }

    return { className, text, rangeText: `Норма: ${min} - ${max}` };
}

window.enableEditMode = function(id) {
    document.getElementById(`view-${id}`).classList.add('hidden');
    document.getElementById(`edit-${id}`).classList.remove('hidden');
    document.getElementById(`input-${id}`).focus();
}

window.cancelEditMode = function(id) {
    document.getElementById(`view-${id}`).classList.remove('hidden');
    document.getElementById(`edit-${id}`).classList.add('hidden');
}

window.saveIndicatorValue = async function(id) {
    const input = document.getElementById(`input-${id}`);
    const newValue = parseFloat(input.value);

    if (isNaN(newValue)) {
        alert("Будь ласка, введіть число");
        return;
    }

    input.disabled = true;

    try {
        const res = await authFetch(`/api/analyses/${currentAnalysisId}/indicators/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: newValue })
        });

        if (!res.ok) throw new Error('Failed to update');

        const result = await res.json();
        const updatedInd = result.data.indicators.find(i => i._id === id);

        const min = parseFloat(updatedInd.referenceMin);
        const max = parseFloat(updatedInd.referenceMax);
        const statusInfo = getStatusInfo(newValue, min, max);
        const units = updatedInd.units || '';

        const valText = document.getElementById(`val-text-${id}`);
        valText.innerHTML = `${newValue} <small>${units}</small>`;
        valText.className = `value-text ${statusInfo.className}`;

        const badge = document.getElementById(`badge-${id}`);
        if (badge) {
            badge.innerText = statusInfo.text;
            badge.className = `status-badge ${statusInfo.className}`;
        }

        await loadHistoryInitial(); 
        cancelEditMode(id);

    } catch (error) {
        console.error(error);
        alert('Помилка збереження. Спробуйте ще раз.');
    } finally {
        input.disabled = false;
    }
}

const historyListElement = document.getElementById('historyList');
const indicatorSelectElement = document.getElementById('indicatorSelect');

async function loadHistoryInitial() {
    if (!historyListElement || !indicatorSelectElement) return;
    try {
        const res = await authFetch('/api/analyses/history');
        const responseData = await res.json();
        if (!res.ok) throw new Error(responseData.message || 'Помилка історії');
        
        globalHistoryData = responseData.data.sort((a, b) => new Date(a.analysisDate) - new Date(b.analysisDate));

        if (globalHistoryData.length === 0) {
            historyListElement.innerHTML = '<li>Історія порожня.</li>';
            indicatorSelectElement.innerHTML = '<option disabled selected>Дані відсутні</option>';
            renderChart([], [], 'Дані відсутні', null, null);
            return;
        }

        renderHistoryList([...globalHistoryData].reverse());
        populateIndicatorSelect();

    } catch (err) {
        if (err.message !== 'Сесія закінчилася. Увійдіть знову.') {
            historyListElement.innerHTML = '<li>Не вдалося завантажити історію.</li>';
            indicatorSelectElement.innerHTML = '<option disabled selected>Помилка завантаження</option>';
            renderChart([], [], 'Помилка завантаження', null, null);
        }
    }
}

function renderHistoryList(dataDesc) {
    historyListElement.innerHTML = '';
    dataDesc.forEach(item => {
        const li = document.createElement('li');
        const dateStr = new Date(item.analysisDate).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' });
        li.innerText = `${dateStr} — Показників: ${item.indicators.length}`;
        historyListElement.appendChild(li);
    });
}

function populateIndicatorSelect() {
    const allIndicatorsSet = new Set();
    globalHistoryData.forEach(analysis => {
        analysis.indicators.forEach(ind => allIndicatorsSet.add(ind.name));
    });
    
    const uniqueIndicators = Array.from(allIndicatorsSet).sort();

    indicatorSelectElement.innerHTML = '';
    if (uniqueIndicators.length === 0) {
         indicatorSelectElement.innerHTML = '<option disabled selected>Показників не знайдено</option>';
         renderChart([], [], 'Дані відсутні', null, null);
         return;
    }

    uniqueIndicators.forEach(indName => {
        const option = document.createElement('option');
        option.value = indName;
        option.innerText = indName;
        indicatorSelectElement.appendChild(option);
    });

    indicatorSelectElement.selectedIndex = 0;
    updateChartFromSelection();
}

function updateChartFromSelection() {
    const selectedIndicatorName = indicatorSelectElement.value;
    if (!selectedIndicatorName) return;

    const labels = globalHistoryData.map(item => new Date(item.analysisDate).toLocaleDateString('uk-UA', {day: '2-digit', month: '2-digit'}));
    const dataPoints = globalHistoryData.map(item => {
        const ind = item.indicators.find(i => i.name === selectedIndicatorName);
        return ind ? ind.value : null;
    });

    let units = '';
    let refMin = null;
    let refMax = null;

    for (const item of globalHistoryData) {
        const ind = item.indicators.find(i => i.name === selectedIndicatorName);
        if (ind) { 
            units = ind.units;
            refMin = parseFloat(ind.referenceMin);
            refMax = parseFloat(ind.referenceMax);
            break; 
        }
    }
    
    const titleUnitPart = units ? ` (${units})` : '';
    renderChart(labels, dataPoints, `${selectedIndicatorName}${titleUnitPart}`, refMin, refMax);
}

if (indicatorSelectElement) {
    indicatorSelectElement.addEventListener('change', updateChartFromSelection);
}

function renderChart(labels, data, title, refMin, refMax) {
    const ctx = document.getElementById('mainChart'); 
    if (!ctx) return;
    if (myChart) myChart.destroy();

    const primaryColor = '#2563eb';
    const dangerColor = '#dc2626';

    myChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: title || 'Показник',
                data: data,
                borderColor: primaryColor, 
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2, 
                tension: 0.1,
                fill: true,
                pointBackgroundColor: (context) => {
                    const value = context.raw;
                    if (value !== null && !isNaN(refMin) && !isNaN(refMax)) {
                        if (value < refMin || value > refMax) return dangerColor;
                    }
                    return primaryColor;
                },
                pointBorderColor: '#fff',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: true, labels: { font: { size: 14, weight: 'bold' } } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        afterLabel: (context) => {
                            if (!isNaN(refMin) && !isNaN(refMax)) {
                                return ` (Норма: ${refMin} - ${refMax})`;
                            }
                            return '';
                        }
                    }
                }
            }, 
            scales: { 
                y: { beginAtZero: false },
                x: { title: { display: true, text: 'Дата' } } 
            } 
        }
    });
}

loadHistoryInitial();