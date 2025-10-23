let video;
let canvas;
let ctx;
let model;
let jensonHeadImage;
let isDetecting = false;
let detectionInterval = null;
let currentStream = null; // 追蹤當前的串流
let expandRatio = 1.75; // 可配置的擴展比例
let currentLang = 'zh-TW'; // 當前語言

const startButton = document.getElementById('startButton');
const statusDiv = document.getElementById('status');
const imageUpload = document.getElementById('imageUpload');
const expandRatioSlider = document.getElementById('expandRatio');
const ratioValue = document.getElementById('ratioValue');
const resetConfigButton = document.getElementById('resetConfig');

// 多語言翻譯
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

// 翻譯函數
function t(key, params = {}) {
    let text = translations[currentLang][key] || key;
    // 替換參數
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

// 更新頁面語言
function updateLanguage(lang) {
    currentLang = lang;

    // 更新所有帶有 data-i18n 的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });

    // 更新按鈕 active 狀態
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 儲存語言偏好
    localStorage.setItem('preferredLanguage', lang);
}

// 更新狀態訊息
function updateStatus(message, type = 'normal') {
    statusDiv.textContent = message;
    statusDiv.className = type === 'error' ? 'error' : type === 'success' ? 'success' : '';
}

// 初始化
async function init() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // 載入語言偏好
    const savedLang = localStorage.getItem('preferredLanguage') || 'zh-TW';
    updateLanguage(savedLang);

    // 載入 Jenson head 圖片
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
                console.error('圖片載入錯誤:', e);
                reject(new Error('無法載入 jenson_head.webp'));
            };
        });
        updateStatus(t('statusImageLoaded'));
    } catch (error) {
        updateStatus(t('errorImageLoad') + ': ' + error.message, 'error');
        return;
    }

    // 載入人臉偵測模型
    updateStatus(t('statusLoadingModel'));
    try {
        model = await blazeface.load();
        updateStatus(t('statusModelLoaded'), 'success');
        startButton.disabled = false;
    } catch (error) {
        updateStatus(t('errorModelLoad') + ': ' + error.message, 'error');
    }
}

// 開啟相機
async function startCamera() {
    try {
        // 先確保之前的相機已經完全停止
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }

        // 清除之前的計時器
        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }

        updateStatus(t('statusOpeningCamera'));

        // 偵測是否為手機
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const constraints = {
            video: isMobile ? {
                facingMode: 'environment', // 手機使用後置鏡頭
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } : {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream; // 保存串流引用

        video.srcObject = stream;

        // 等待 metadata 載入（使用 once 選項）
        await new Promise((resolve) => {
            const handler = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                console.log('Canvas 設定尺寸:', canvas.width, 'x', canvas.height);
                resolve();
            };
            video.addEventListener('loadedmetadata', handler, { once: true });
        });

        // 開始播放
        await video.play();

        // 播放成功後開始偵測
        console.log('Video 開始播放');
        updateStatus(t('statusCameraOpened'), 'success');
        startButton.textContent = t('resetCameraButton');
        startButton.onclick = resetCamera;
        isDetecting = true;
        // 使用 setInterval 每 1/60 秒 (約 16.67ms) 執行一次
        detectionInterval = setInterval(detectFaces, 1000 / 60);

    } catch (error) {
        updateStatus(t('errorCameraAccess') + ': ' + error.message, 'error');
        // 清理
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
    }
}

// 重啟相機
async function resetCamera() {
    console.log('重啟相機');

    updateStatus(t('statusResetting'));
    startButton.disabled = true;

    // 先設置標誌為 false
    isDetecting = false;

    // 清除計時器
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
        console.log('已清除計時器');
    }

    // 停止相機串流
    if (currentStream) {
        currentStream.getTracks().forEach(track => {
            track.stop();
            console.log('已停止 track:', track.kind);
        });
        currentStream = null;
    }

    // 清除 video source
    if (video) {
        video.pause();
        video.srcObject = null;
        video.onloadedmetadata = null;
        video.onplay = null;
        video.onplaying = null;
    }

    // 清空 canvas
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 等待一小段時間確保資源釋放
    await new Promise(resolve => setTimeout(resolve, 300));

    // 重新啟動相機
    startButton.disabled = false;
    await startCamera();
}

// 偵測人臉並替換
async function detectFaces() {
    if (!isDetecting) return;

    // 檢查 video 是否準備好
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
    }

    try {
        // 步驟 1: 先偵測人臉（從 video 元素）
        const predictions = await model.estimateFaces(video, false);

        // 步驟 2: 繪製整個 video 畫面到 canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (predictions.length > 0) {
            updateStatus(t('statusDetecting', { count: predictions.length }), 'success');

            // 步驟 3: 在偵測到的人臉位置繪製 Jenson head
            predictions.forEach((prediction) => {
                // 取得人臉位置
                const start = prediction.topLeft;
                const end = prediction.bottomRight;
                const size = [end[0] - start[0], end[1] - start[1]];

                // 計算 Jenson head 圖片的長寬比
                const jensonAspectRatio = jensonHeadImage.width / jensonHeadImage.height;

                // 使用可配置的擴大範圍
                const faceWidth = size[0] * expandRatio;

                // 根據圖片的長寬比計算高度，保持比例
                let drawWidth = faceWidth;
                let drawHeight = drawWidth / jensonAspectRatio;

                // 計算中心對齊的位置
                const faceCenterX = start[0] + size[0] / 2;
                const faceCenterY = start[1] + size[1] / 2;

                const drawX = faceCenterX - drawWidth / 2;
                const drawY = faceCenterY - drawHeight / 2;

                // 繪製 Jenson head 圖片覆蓋在人臉上（保持原始比例）
                ctx.drawImage(
                    jensonHeadImage,
                    drawX,
                    drawY,
                    drawWidth,
                    drawHeight
                );

                // 繪製偵測框（除錯用）
                // ctx.strokeStyle = '#00ff00';
                // ctx.lineWidth = 3;
                // ctx.strokeRect(start[0], start[1], size[0], size[1]);

                // 繪製替換區域框（紅色）
                // ctx.strokeStyle = '#ff0000';
                // ctx.lineWidth = 2;
                // ctx.strokeRect(drawX, drawY, expandedWidth, expandedHeight);
            });
        } else {
            updateStatus(t('statusNoFace'));
        }
    } catch (error) {
        console.error('偵測錯誤:', error);
    }
}

// 綁定按鈕事件
startButton.addEventListener('click', startCamera);
startButton.disabled = true;

// 配置功能

// 上傳圖片
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
                    console.log('已載入新圖片:', jensonHeadImage.width, 'x', jensonHeadImage.height);
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

// 調整大小比例
expandRatioSlider.addEventListener('input', (event) => {
    expandRatio = parseFloat(event.target.value);
    ratioValue.textContent = expandRatio.toFixed(2);
});

// 重置配置
resetConfigButton.addEventListener('click', async () => {
    // 重置比例
    expandRatio = 1.75;
    expandRatioSlider.value = 1.75;
    ratioValue.textContent = '1.75';

    // 重新載入預設圖片
    updateStatus(t('statusResetConfig'));
    jensonHeadImage = new Image();
    jensonHeadImage.src = 'jenson_head.webp';

    await new Promise((resolve, reject) => {
        jensonHeadImage.onload = () => {
            console.log('已重置為預設圖片');
            updateStatus(t('statusConfigReset'), 'success');
            resolve();
        };
        jensonHeadImage.onerror = reject;
    });

    // 清除檔案輸入
    imageUpload.value = '';
});

// 語言切換事件
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        updateLanguage(lang);
    });
});

// 啟動應用程式
init().catch(error => {
    updateStatus(t('errorInit') + ': ' + error.message, 'error');
});
