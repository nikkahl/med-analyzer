// ==========================================
// 1. ГЛОБАЛЬНІ ЗМІННІ ТА АВТОРИЗАЦІЯ
// ==========================================

let myChart = null;
let globalHistoryData = [];

let cameraStream = null;
let capturedPhotoBlob = null;
let currentUploadMode = 'file';
let currentAnalysisId = null; 

let historyPage = 1;
const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');

const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const emailDisplay = document.getElementById('userEmailDisplay');
if (emailDisplay) emailDisplay.innerText = localStorage.getItem('userEmail') || 'Користувач';

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', forceLogout);

function forceLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

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

// ==========================================
// 2. ЗАВАНТАЖЕННЯ ФАЙЛІВ ТА КАМЕРА
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
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('skeletonSection').classList.remove('hidden');
        if (uploadStatus) uploadStatus.classList.add('hidden');

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
            if (err.message !== 'Сесія закінчилася. Увійдіть знову.') {
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
    if (dropArea && dropArea.querySelector('.file-msg')) dropArea.querySelector('.file-msg').innerText = 'Перетягніть файл...';
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
// 3. ВІДОБРАЖЕННЯ РЕЗУЛЬТАТІВ ТА РЕДАГУВАННЯ
// ==========================================

function displayResultWithNorms(data) {
    const resultSection = document.getElementById('resultSection');
    const indicatorsList = document.getElementById('parsedIndicatorsList');
    const rawTextDisplay = document.getElementById('rawOcrTextDisplay');
    
    const imageDisplay = document.getElementById('analysisImageDisplay');
    const imageDetailsBlock = document.getElementById('imageDetailsBlock');
    
    if (!resultSection || !indicatorsList) {
        console.error("Не знайдено елементи DOM");
        return;
    }
    
    currentAnalysisId = data._id; 
    resultSection.classList.remove('hidden');
    indicatorsList.innerHTML = '';

    if (imageDisplay && imageDetailsBlock) {
        if (data.imageUrl) {
            imageDisplay.src = data.imageUrl;
            imageDetailsBlock.classList.remove('hidden');
        } else {
            imageDisplay.src = '';
            imageDetailsBlock.classList.add('hidden');
        }
    }

    let indicators = data.indicators;
    if (!indicators || indicators.length === 0) {
        indicators = data.parsedData || [];
    }

    if (indicators.length === 0) {
        indicatorsList.innerHTML = '<li style="padding:1rem; text-align:center;">У цьому записі немає розпізнаних показників.</li>';
        if (rawTextDisplay) rawTextDisplay.innerText = data.rawOcrText || '';
        return;
    }

    indicators.forEach(ind => {
        if (!ind) return;
        const li = document.createElement('li');
        li.className = 'indicator-item';
        const rowId = ind._id || Math.random().toString(36).substr(2, 9);
        li.id = `indicator-row-${rowId}`; 

        const val = parseFloat(ind.value);
        const min = parseFloat(ind.referenceMin);
        const max = parseFloat(ind.referenceMax);
        const units = ind.units || '';
        const statusInfo = getStatusInfo(val, min, max);

        li.innerHTML = `
            <div class="indicator-info">
                <span class="indicator-name">${ind.name || 'Невідомий показник'}</span>
                <span class="indicator-range">${statusInfo.rangeText} ${units}</span>
            </div>
            
            <div class="indicator-result">
                <div class="view-mode" id="view-${rowId}">
                    <span class="value-text ${statusInfo.className}" id="val-text-${rowId}">${ind.value} <small>${units}</small></span>
                    ${statusInfo.text ? `<span class="status-badge ${statusInfo.className}" id="badge-${rowId}">${statusInfo.text}</span>` : ''}
                    <div class="edit-controls">
                        ${ind._id ? `<button onclick="enableEditMode('${ind._id}')" class="btn-icon-small" title="Редагувати">редагувати</button>` : ''}
                    </div>
                </div>
                ${ind._id ? `
                <div class="edit-mode hidden" id="edit-${rowId}" style="display: flex; align-items: center; gap: 5px;">
                    <input type="number" class="edit-input" id="input-${rowId}" value="${ind.value}" step="0.1">
                    <button onclick="saveIndicatorValue('${ind._id}')" class="btn-icon-small" style="color: green;">зберегти</button>
                    <button onclick="cancelEditMode('${ind._id}')" class="btn-icon-small" style="color: red;">відмінити</button>
                </div>` : ''}
            </div>
        `;
        indicatorsList.appendChild(li);
    });
    
    if (rawTextDisplay) rawTextDisplay.innerText = data.rawOcrText || '';
    
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

        await loadChartsData(); 
        cancelEditMode(id);

    } catch (error) {
        console.error(error);
        alert('Помилка збереження. Спробуйте ще раз.');
    } finally {
        input.disabled = false;
    }
}

// ==========================================
// 4. ГРАФІКИ ТА АНАЛІТИКА (Стара історія)
// ==========================================

const indicatorSelectElement = document.getElementById('indicatorSelect');

async function loadChartsData() {
    if (!indicatorSelectElement) return;
    try {
        const res = await authFetch('/api/analyses/history?limit=20'); 
        const responseData = await res.json();
        
        if (!res.ok) return;
        
        globalHistoryData = responseData.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        console.log("Дані для графіків завантажено:", globalHistoryData); // ДЕБАГ

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
            if (ind && ind.name) {
                allIndicatorsSet.add(ind.name.trim());
            }
        });
    });
    
    const uniqueIndicators = Array.from(allIndicatorsSet).sort();
    console.log("Знайдені показники:", uniqueIndicators); // ДЕБАГ

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

// ==========================================
// 5. ІСТОРІЯ У ВИГЛЯДІ СІТКИ (Нова логіка)
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
    historyGrid.innerHTML = ''; 
    analyses.forEach(item => {
        const date = new Date(item.createdAt).toLocaleDateString('uk-UA', {
            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'history-card';
        card.style.position = 'relative';

        card.innerHTML = `
            <div class="history-date"> дата ${date}</div>
            <div class="history-status success">Оброблено</div>
            <div style="font-size: 0.9rem; color: #555; margin-top: 5px;">Натисніть для деталей</div>
            
            <button class="delete-btn" title="Видалити запис">видалити</button>
        `;
        
        card.onclick = function() {
            openHistoryItem(item._id);
        };

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.onclick = function(e) {
            e.stopPropagation(); 
            deleteAnalysisItem(item._id);
        };
        
        historyGrid.appendChild(card);
    });
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
        
        console.log(`Запит деталей для ID: ${id}`);
        const res = await authFetch(`/api/analyses/${id}`);
        const result = await res.json();
        
        if(skeleton) skeleton.classList.add('hidden');

        if (res.ok) {
            console.log('Дані отримано:', result.data);
            
            displayResultWithNorms(result.data);
            
            if(resultSec) {
                resultSec.classList.remove('hidden');
                resultSec.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Помилка: Не знайдено блок id="resultSection" в HTML!');
            }
        } else {
            console.error('Помилка API:', result);
            alert('Не вдалося завантажити деталі: ' + (result.message || 'Помилка сервера'));
        }
    } catch (err) {
        console.error('Помилка openHistoryItem:', err);
        document.getElementById('skeletonSection')?.classList.add('hidden');
        alert('Сталася помилка при відкритті: ' + err.message);
    }
}

// ==========================================
// 6. ІНІЦІАЛІЗАЦІЯ ПРИ ЗАПУСКУ
// ==========================================

if (token) {
    loadChartsData(); 
    initHistoryGrid(); 
}

async function deleteAnalysisItem(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей аналіз? Це незворотно.')) {
        return;
    }

    try {
        const res = await authFetch(`/api/analyses/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            await loadHistoryInitial(); 
            await loadChartsData(); 
            if (currentAnalysisId === id) {
                document.getElementById('resultSection').classList.add('hidden');
            }
        } else {
            alert('Не вдалося видалити аналіз');
        }
    } catch (err) {
        console.error(err);
        alert('Помилка при видаленні');
    }
}