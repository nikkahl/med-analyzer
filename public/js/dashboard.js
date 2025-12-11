// ==========================================
// 1. ГЛОБАЛЬНІ ЗМІННІ
// ==========================================
let myChart = null;
let globalHistoryData = [];
let cameraStream = null;
let capturedPhotoBlob = null;
let currentUploadMode = 'file';
let currentAnalysisId = null; 
let historyPage = 1;

// DOM
const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const indicatorSelectElement = document.getElementById('indicatorSelect');

// --- АВТОРИЗАЦІЯ ---
const token = localStorage.getItem('token');
const authSection = document.getElementById('authSection');
const mainApp = document.getElementById('mainApp');

if (!token) {
    if (authSection) authSection.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
} else {
    if (authSection) authSection.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
}

const emailDisplay = document.getElementById('userEmailDisplay');
if (emailDisplay) emailDisplay.innerText = localStorage.getItem('userEmail') || 'Користувач';

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
});

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/';
        throw new Error('Сесія закінчилася.');
    }
    return response;
}

// ==========================================
// 2. КАМЕРА ТА ЗАВАНТАЖЕННЯ
// ==========================================
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
        cameraError.innerText = 'Камера недоступна.'; cameraError.classList.remove('hidden');
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
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('skeletonSection').classList.remove('hidden');
        
        document.getElementById('skeletonSection').scrollIntoView({ behavior: 'smooth' });

        try {
            const res = await authFetch('/api/analyses/upload', { method: 'POST', body: formData });
            const result = await res.json();

            document.getElementById('skeletonSection').classList.add('hidden');

            if (res.ok) {
                displayResultWithNorms(result.data);
                loadChartsData(); 
                initHistoryGrid();
                resetUploadForm(); 
            } else {
                throw new Error(result.message || 'Помилка');
            }
        } catch (err) {
            document.getElementById('skeletonSection').classList.add('hidden');
            if (err.message !== 'Сесія закінчилася.') {
                showStatus(err.message, 'error');
            }
        } finally {
            uploadBtn.disabled = false;
            checkUploadReadiness();
        }
    }); 
}

function resetUploadForm() {
    uploadForm.reset();
    if (dropArea && dropArea.querySelector('.file-msg')) dropArea.querySelector('.file-msg').innerText = 'Файл (JPG, PNG)';
    capturedPhotoBlob = null; 
    if (photoPreview) { photoPreview.classList.add('hidden'); photoPreview.src = ''; }
    if (retakePhotoBtn) retakePhotoBtn.classList.add('hidden');
    if (startCameraBtn) startCameraBtn.classList.remove('hidden');
    if (videoFeed) videoFeed.classList.add('hidden');
    stopCamera(); checkUploadReadiness();
}

function showStatus(message, type) {
    if (!uploadStatus) return;
    uploadStatus.innerText = message;
    uploadStatus.className = `status-message ${type}`;
    uploadStatus.classList.remove('hidden');
}

// ==========================================
// 3. ВІДОБРАЖЕННЯ РЕЗУЛЬТАТІВ 
// ==========================================

function displayResultWithNorms(data) {
    const resultSection = document.getElementById('resultSection');
    const indicatorsList = document.getElementById('parsedIndicatorsList');
    const detailsContainer = document.getElementById('detailsContainer');
    
    if (!resultSection || !indicatorsList) return;
    
    currentAnalysisId = data._id; 
    resultSection.classList.remove('hidden');
    indicatorsList.innerHTML = '';

    // --- 2 КНОПКИ (ШТОРКИ) ---
    let detailsHTML = '';

    // 1. ТЕКСТ
    detailsHTML += `
        <details class="raw-text-details">
            <summary> Показати необроблений текст </summary>
            <div class="details-content">
                <pre id="rawOcrTextDisplay" style="background:#f4f4f4; padding:10px; border-radius:5px; white-space: pre-wrap; font-size: 0.85rem; margin:0;">${data.rawOcrText || 'Текст не знайдено'}</pre>
            </div>
        </details>
    `;

    // 2. ФОТО (якщо є)
    if (data.imageUrl) {
        detailsHTML += `
            <details class="raw-text-details">
                <summary> Показати оригінальне фото</summary>
                <div class="details-content" style="text-align: center;">
                    <img src="${data.imageUrl}" class="constrained-image" alt="Фото аналізу">
                </div>
            </details>
        `;
    }

    if (detailsContainer) {
        detailsContainer.innerHTML = detailsHTML;
    }

    // --- ПОКАЗНИКИ ---
    let indicators = data.indicators || data.parsedData || [];

    if (indicators.length === 0) {
        indicatorsList.innerHTML = '<li style="padding:1rem; text-align:center;">У цьому записі немає розпізнаних показників.</li>';
    } else {
        indicators.forEach(ind => {
            if (!ind) return;
            const li = document.createElement('li');
            li.className = 'indicator-item';
            const rowId = ind._id || Math.random().toString(36).substr(2, 9);
            
            const val = parseFloat(ind.value);
            const min = parseFloat(ind.referenceMin);
            const max = parseFloat(ind.referenceMax);
            const units = ind.units || '';
            const statusInfo = getStatusInfo(val, min, max);

            li.innerHTML = `
                <div class="indicator-info">
                    <span class="indicator-name">${ind.name || 'Невідомий'}</span>
                    <span class="indicator-range">${statusInfo.rangeText} ${units}</span>
                </div>
                <div class="indicator-result">
                    <div class="view-mode" id="view-${rowId}">
                        <span class="value-text ${statusInfo.className}" id="val-text-${rowId}">${ind.value} <small>${units}</small></span>
                        ${statusInfo.text ? `<span class="status-badge ${statusInfo.className}">${statusInfo.text}</span>` : ''}
                        <div class="edit-controls">
                            ${ind._id ? `<button onclick="enableEditMode('${ind._id}')" class="btn-icon-small" title="Редагувати">✎</button>` : ''}
                        </div>
                    </div>
                    ${ind._id ? `
                    <div class="edit-mode hidden" id="edit-${rowId}" style="display: flex; align-items: center; gap: 5px;">
                        <input type="number" class="edit-input" id="input-${rowId}" value="${ind.value}" step="0.1">
                        <button onclick="saveIndicatorValue('${ind._id}')" class="btn-icon-small" style="color: green;">✓</button>
                        <button onclick="cancelEditMode('${ind._id}')" class="btn-icon-small" style="color: red;">✕</button>
                    </div>` : ''}
                </div>
            `;
            indicatorsList.appendChild(li);
        });
    }
    
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function getStatusInfo(val, min, max) {
    const hasNorms = !isNaN(min) && !isNaN(max);
    if (!hasNorms) return { className: 'status-neutral', text: '', rangeText: 'Норма не вказана' };

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

        await loadChartsData(); 
        cancelEditMode(id);

    } catch (error) {
        console.error(error);
        alert('Помилка збереження.');
    } finally {
        input.disabled = false;
    }
}

// ==========================================
// 4. ГРАФІКИ
// ==========================================

async function loadChartsData() {
    if (!indicatorSelectElement) return;
    try {
        const res = await authFetch('/api/analyses/history?limit=20'); 
        const responseData = await res.json();
        
        if (!res.ok) return;
        
        globalHistoryData = responseData.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (globalHistoryData.length === 0) {
            indicatorSelectElement.innerHTML = '<option disabled selected>Дані відсутні</option>';
            renderChart([], [], 'Дані відсутні', null, null);
            return;
        }

        populateIndicatorSelect();
    } catch (err) {
        console.error("Помилка графіків:", err);
    }
}

function populateIndicatorSelect() {
    const allIndicatorsSet = new Set();

    globalHistoryData.forEach(analysis => {
        const indicators = analysis.indicators || analysis.parsedData || [];
        indicators.forEach(ind => {
            if (ind && ind.name) allIndicatorsSet.add(ind.name.trim());
        });
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

    indicatorSelectElement.removeEventListener('change', updateChartFromSelection);
    indicatorSelectElement.addEventListener('change', updateChartFromSelection);
    
    indicatorSelectElement.selectedIndex = 0;
    updateChartFromSelection();
}

function updateChartFromSelection() {
    const selectedIndicatorName = indicatorSelectElement.value;
    if (!selectedIndicatorName) return;

    const labels = [];
    const dataPoints = [];
    let units = '';
    let refMin = null;
    let refMax = null;

    globalHistoryData.forEach(item => {
        const indicators = item.indicators || item.parsedData || [];
        const ind = indicators.find(i => i.name && i.name.trim() === selectedIndicatorName);
        
        if (ind) {
            const dateLabel = new Date(item.createdAt).toLocaleDateString('uk-UA', {day: '2-digit', month: '2-digit'});
            labels.push(dateLabel);
            dataPoints.push(ind.value);
            
            if (!units) units = ind.units;
            if (refMin === null) refMin = parseFloat(ind.referenceMin);
            if (refMax === null) refMax = parseFloat(ind.referenceMax);
        }
    });
    
    const titleUnitPart = units ? ` (${units})` : '';
    renderChart(labels, dataPoints, `${selectedIndicatorName}${titleUnitPart}`, refMin, refMax);
}

function renderChart(labels, data, label, minRef, maxRef) {
    const ctx = document.getElementById('dynamicsChart');
    if (!ctx) return;

    if (myChart) myChart.destroy();

    const datasets = [{
        label: label,
        data: data,
        borderColor: '#4a90e2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        tension: 0.3,
        fill: true,
        pointStyle: 'circle',
        pointRadius: 4
    }];

    if (minRef !== null && maxRef !== null) {
        const normStyle = {
            borderColor: 'rgba(128, 128, 128, 0.6)', 
            borderDash: [5, 5],
            pointRadius: 0,
            pointStyle: 'line', 
            fill: false,
            borderWidth: 2
        };

        datasets.push({
            label: 'Мін. норма',
            data: new Array(data.length).fill(minRef),
            ...normStyle
        });
        datasets.push({
            label: 'Макс. норма',
            data: new Array(data.length).fill(maxRef),
            ...normStyle
        });
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: false } },
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        boxWidth: 20,
                        padding: 25 
                    }
                }
            },
            layout: {
                padding: {
                    top: 20 
                }
            }
        }
    });
}

// ==========================================
// 5. ІСТОРІЯ (МІНІМАЛІЗМ: ПОВЕРНУТО)
// ==========================================

async function initHistoryGrid() {
    if (!historySection) return;
    historyPage = 1;
    historyGrid.innerHTML = ''; 
    await loadHistoryPage();
    historySection.classList.remove('hidden');
}

async function loadHistoryPage() {
    try {
        const res = await authFetch(`/api/analyses/history?page=${historyPage}`);
        const result = await res.json();

        if (result.data && result.data.length > 0) {
            renderHistoryCards(result.data);
            if (historyPage < result.totalPages) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
            historyPage++;
        } else {
            if(historyPage === 1) {
                historyGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Історія поки що порожня.</p>';
                loadMoreBtn.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error('Помилка історії:', err);
    }
}

function renderHistoryCards(analyses) {
    if (historyPage === 1) historyGrid.innerHTML = '';

    analyses.forEach(item => {
        const date = new Date(item.createdAt).toLocaleDateString('uk-UA', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
        });

        const indicatorsCount = item.indicators ? item.indicators.length : 0;

        const card = document.createElement('div');
        card.className = 'history-card-minimal'; 
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div style="padding-right: 20px;">
                    <div style="font-weight: 600; color: #333; font-size: 1rem;"> ${date}</div>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 8px;">Знайдено показників: ${indicatorsCount}</div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="history-status success" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 12px; background: #f3f4f6; color: #555; font-weight: 600;">Оброблено</span>
                    
                    <button class="btn-delete-item" onclick="deleteAnalysisItem('${item._id}', event)" title="Видалити" style="border: none; background: #fff0f0; color: #ff6b6b; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">✕</button>
                </div>
            </div>
        `;
        
        card.onclick = function(e) {
            if (!e.target.closest('.btn-delete-item')) {
                openHistoryItem(item._id);
            }
        };
        
        historyGrid.appendChild(card);
    });
}

window.deleteAnalysisItem = async function(id, event) {
    if (event) event.stopPropagation();
    if (!confirm('Ви точно хочете видалити цей аналіз з історії?')) return;

    try {
        const res = await authFetch(`/api/analyses/${id}`, { method: 'DELETE' });
        if (res.ok) {
            initHistoryGrid();
            loadChartsData();
        } else {
            alert('Не вдалося видалити запис');
        }
    } catch (err) {
        console.error(err);
        alert('Помилка видалення');
    }
}

async function openHistoryItem(id) {
    try {
        const skeleton = document.getElementById('skeletonSection');
        const resultSec = document.getElementById('resultSection');

        if(skeleton) {
            skeleton.classList.remove('hidden');
            skeleton.scrollIntoView({ behavior: 'smooth' });
        }
        if(resultSec) resultSec.classList.add('hidden'); 
        
        const res = await authFetch(`/api/analyses/${id}`);
        const result = await res.json();
        
        if(skeleton) skeleton.classList.add('hidden');

        if (res.ok) {
            displayResultWithNorms(result.data);
        } else {
            alert('Помилка: ' + (result.message || 'Сервер не відповідає'));
        }
    } catch (err) {
        document.getElementById('skeletonSection')?.classList.add('hidden');
        alert('Сталася помилка при відкритті.');
    }
}

if (token) {
    loadChartsData(); 
    initHistoryGrid(); 
}