let video;
let canvas;
let ctx;
let model;
let jensonHeadImage;
let isDetecting = false;
let detectionInterval = null;
let currentStream = null; // Track current stream
let expandRatio = 1.75; // Configurable expansion ratio
let currentLang = 'en'; // Current language

const startButton = document.getElementById('startButton');
const statusDiv = document.getElementById('status');
const imageUpload = document.getElementById('imageUpload');
const expandRatioSlider = document.getElementById('expandRatio');
const ratioValue = document.getElementById('ratioValue');
const resetConfigButton = document.getElementById('resetConfig');

// Translations for i18n
const translations = {
    'zh-TW': {
        title: 'Jenson Head Replacer',
        settings: '設定',
        uploadLabel: '上傳替換圖片：',
        uploadHint: '選擇要替換人臉的圖片',
        sizeLabel: '圖片大小比例：',
        sizeHint: '調整替換圖片的大小（1.0 = 原始人臉大小）',
        resetButton: '重置為預設值',
        startButton: '開啟相機',
        resetCameraButton: '重啟',
        statusReady: '準備就緒',
        statusLoadingImage: '正在載入 Jenson head 圖片...',
        statusImageLoaded: '圖片載入完成',
        statusLoadingModel: '正在載入人臉偵測模型...',
        statusModelLoaded: '模型載入完成，請點擊按鈕開啟相機',
        statusOpeningCamera: '正在開啟相機...',
        statusCameraOpened: '相機已開啟，正在偵測人臉...',
        statusDetecting: '偵測到 {count} 個人臉',
        statusNoFace: '未偵測到人臉',
        statusResetting: '正在重啟相機...',
        statusNewImageLoading: '正在載入新圖片...',
        statusNewImageLoaded: '新圖片載入成功！',
        statusResetConfig: '正在重置為預設圖片...',
        statusConfigReset: '已重置為預設值',
        errorImageLoad: '圖片載入失敗',
        errorModelLoad: '模型載入失敗',
        errorCameraAccess: '無法存取相機',
        errorInit: '初始化失敗'
    },
    'en': {
        title: 'Jenson Head Replacer',
        settings: 'Settings',
        uploadLabel: 'Upload Replacement Image:',
        uploadHint: 'Select an image to replace faces',
        sizeLabel: 'Image Size Ratio:',
        sizeHint: 'Adjust the size of the replacement image (1.0 = original face size)',
        resetButton: 'Reset to Default',
        startButton: 'Start Camera',
        resetCameraButton: 'Reset',
        statusReady: 'Ready',
        statusLoadingImage: 'Loading Jenson head image...',
        statusImageLoaded: 'Image loaded',
        statusLoadingModel: 'Loading face detection model...',
        statusModelLoaded: 'Model loaded, click button to start camera',
        statusOpeningCamera: 'Opening camera...',
        statusCameraOpened: 'Camera opened, detecting faces...',
        statusDetecting: 'Detected {count} face(s)',
        statusNoFace: 'No faces detected',
        statusResetting: 'Resetting camera...',
        statusNewImageLoading: 'Loading new image...',
        statusNewImageLoaded: 'New image loaded successfully!',
        statusResetConfig: 'Resetting to default image...',
        statusConfigReset: 'Reset to default',
        errorImageLoad: 'Failed to load image',
        errorModelLoad: 'Failed to load model',
        errorCameraAccess: 'Cannot access camera',
        errorInit: 'Initialization failed'
    }
};

// Translation function
function t(key, params = {}) {
    let text = translations[currentLang][key] || key;
    // Replace parameters
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

// Update page language
function updateLanguage(lang) {
    currentLang = lang;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });

    // Update button active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Save language preference
    localStorage.setItem('preferredLanguage', lang);
}

// Update status message
function updateStatus(message, type = 'normal') {
    statusDiv.textContent = message;
    statusDiv.className = type === 'error' ? 'error' : type === 'success' ? 'success' : '';
}

// Initialize application
async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Load language preference
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    updateLanguage(savedLang);

    // Load Jenson head image
    updateStatus(t('statusLoadingImage'));
    jensonHeadImage = new Image();
    jensonHeadImage.src = 'jenson_head.webp';

    try {
        await new Promise((resolve, reject) => {
            jensonHeadImage.onload = () => {
                console.log('Jenson head 圖片載入成功:', jensonHeadImage.width, 'x', jensonHeadImage.height);
                resolve();
            };
            jensonHeadImage.onerror = (e) => {
                console.error('Image load error:', e);
                reject(new Error('Failed to load jenson_head.webp'));
            };
        });
        updateStatus(t('statusImageLoaded'));
    } catch (error) {
        updateStatus(t('errorImageLoad') + ': ' + error.message, 'error');
        return;
    }

    // Load face detection model
    updateStatus(t('statusLoadingModel'));
    try {
        model = await blazeface.load();
        updateStatus(t('statusModelLoaded'), 'success');
        startButton.disabled = false;
    } catch (error) {
        updateStatus(t('errorModelLoad') + ': ' + error.message, 'error');
    }
}

// Start camera
async function startCamera() {
    try {
        // Ensure previous camera is fully stopped
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }

        // Clear previous interval
        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }

        updateStatus(t('statusOpeningCamera'));

        // Detect if mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const constraints = {
            video: isMobile ? {
                facingMode: 'environment', // Use rear camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } : {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream; // Save stream reference

        video.srcObject = stream;

        // Wait for metadata to load (using once option)
        await new Promise((resolve) => {
            const handler = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height);
                resolve();
            };
            video.addEventListener('loadedmetadata', handler, { once: true });
        });

        // Start playback
        await video.play();

        // Start detection after playback begins
        console.log('Video playback started');
        updateStatus(t('statusCameraOpened'), 'success');
        startButton.textContent = t('resetCameraButton');
        startButton.onclick = resetCamera;
        isDetecting = true;
        // Use setInterval to run every 1/60 second (~16.67ms)
        detectionInterval = setInterval(detectFaces, 1000 / 60);

    } catch (error) {
        updateStatus(t('errorCameraAccess') + ': ' + error.message, 'error');
        // Cleanup
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
    }
}

// Reset camera
async function resetCamera() {
    console.log('Resetting camera');

    updateStatus(t('statusResetting'));
    startButton.disabled = true;

    // Set flag to false
    isDetecting = false;

    // Clear interval
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
        console.log('Interval cleared');
    }

    // Stop camera stream
    if (currentStream) {
        currentStream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped track:', track.kind);
        });
        currentStream = null;
    }

    // Clear video source
    if (video) {
        video.pause();
        video.srcObject = null;
        video.onloadedmetadata = null;
        video.onplay = null;
        video.onplaying = null;
    }

    // Clear canvas
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Wait briefly to ensure resources are released
    await new Promise(resolve => setTimeout(resolve, 300));

    // Restart camera
    startButton.disabled = false;
    await startCamera();
}

// Detect faces and replace
async function detectFaces() {
    if (!isDetecting) return;

    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
    }

    try {
        // Step 1: Detect faces (from video element)
        const predictions = await model.estimateFaces(video, false);

        // Step 2: Draw entire video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
            updateStatus(t('statusDetecting', { count: predictions.length }), 'success');

            // Step 3: Draw Jenson head at detected face positions
            predictions.forEach((prediction) => {
                // Get face position
                const start = prediction.topLeft;
                const end = prediction.bottomRight;
                const size = [end[0] - start[0], end[1] - start[1]];

                // Calculate Jenson head image aspect ratio
                const jensonAspectRatio = jensonHeadImage.width / jensonHeadImage.height;

                // Use configurable expansion range
                const faceWidth = size[0] * expandRatio;

                // Calculate height based on aspect ratio to maintain proportions
                let drawWidth = faceWidth;
                let drawHeight = drawWidth / jensonAspectRatio;

                // Calculate center-aligned position
                const faceCenterX = start[0] + size[0] / 2;
                const faceCenterY = start[1] + size[1] / 2;

                const drawX = faceCenterX - drawWidth / 2;
                const drawY = faceCenterY - drawHeight / 2;

                // Draw Jenson head image over face (maintaining original aspect ratio)
                ctx.drawImage(
                    jensonHeadImage,
                    drawX,
                    drawY,
                    drawWidth,
                    drawHeight
                );

                // Draw detection box (for debugging)
                // ctx.strokeStyle = '#00ff00';
                // ctx.lineWidth = 3;
                // ctx.strokeRect(start[0], start[1], size[0], size[1]);

                // Draw replacement area box (red)
                // ctx.strokeStyle = '#ff0000';
                // ctx.lineWidth = 2;
                // ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
            });
        } else {
            updateStatus(t('statusNoFace'));
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
}

// Bind button events
startButton.addEventListener('click', startCamera);
startButton.disabled = true;

// Configuration features

// Upload image
imageUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        updateStatus(t('statusNewImageLoading'));

        const reader = new FileReader();
        reader.onload = async (e) => {
            const newImage = new Image();
            newImage.src = e.target.result;

            await new Promise((resolve, reject) => {
                newImage.onload = () => {
                    jensonHeadImage = newImage;
                    console.log('New image loaded:', jensonHeadImage.width, 'x', jensonHeadImage.height);
                    updateStatus(t('statusNewImageLoaded'), 'success');
                    resolve();
                };
                newImage.onerror = reject;
            });
        };
        reader.readAsDataURL(file);
    } catch (error) {
        updateStatus(t('errorImageLoad') + ': ' + error.message, 'error');
    }
});

// Adjust size ratio
expandRatioSlider.addEventListener('input', (event) => {
    expandRatio = parseFloat(event.target.value);
    ratioValue.textContent = expandRatio.toFixed(2);
});

// Reset configuration
resetConfigButton.addEventListener('click', async () => {
    // Reset ratio
    expandRatio = 1.75;
    expandRatioSlider.value = 1.75;
    ratioValue.textContent = '1.75';

    // Reload default image
    updateStatus(t('statusResetConfig'));
    jensonHeadImage = new Image();
    jensonHeadImage.src = 'jenson_head.webp';

    await new Promise((resolve, reject) => {
        jensonHeadImage.onload = () => {
            console.log('Reset to default image');
            updateStatus(t('statusConfigReset'), 'success');
            resolve();
        };
        jensonHeadImage.onerror = reject;
    });

    // Clear file input
    imageUpload.value = '';
});

// Language switch events
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        updateLanguage(lang);
    });
});

// Start application
init().catch(error => {
    updateStatus(t('errorInit') + ': ' + error.message, 'error');
});
