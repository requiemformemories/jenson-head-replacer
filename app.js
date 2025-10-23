let video;
let canvas;
let ctx;
let model;
let jensonHeadImage;
let isDetecting = false;
let detectionInterval = null;

const startButton = document.getElementById('startButton');
const statusDiv = document.getElementById('status');

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

    // 載入 Jenson head 圖片
    updateStatus('正在載入 Jenson head 圖片...');
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
        updateStatus('圖片載入完成');
    } catch (error) {
        updateStatus('圖片載入失敗: ' + error.message, 'error');
        return;
    }

    // 載入人臉偵測模型
    updateStatus('正在載入人臉偵測模型...');
    try {
        model = await blazeface.load();
        updateStatus('模型載入完成，請點擊按鈕開啟相機', 'success');
        startButton.disabled = false;
    } catch (error) {
        updateStatus('模型載入失敗: ' + error.message, 'error');
    }
}

// 開啟相機
async function startCamera() {
    try {
        updateStatus('正在開啟相機...');

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

        video.srcObject = stream;

        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log('Canvas 設定尺寸:', canvas.width, 'x', canvas.height);
        });

        // 等待 video 開始播放
        video.addEventListener('playing', () => {
            console.log('Video 開始播放');
            updateStatus('相機已開啟，正在偵測人臉...', 'success');
            startButton.textContent = '停止';
            startButton.onclick = stopCamera;
            isDetecting = true;
            // 使用 setInterval 每 1/60 秒 (約 16.67ms) 執行一次
            detectionInterval = setInterval(detectFaces, 1000 / 60);
        }, { once: true });

        // 開始播放
        await video.play();
    } catch (error) {
        updateStatus('無法存取相機: ' + error.message, 'error');
    }
}

// 停止相機
function stopCamera() {
    isDetecting = false;
    // 清除計時器
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    video.srcObject = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStatus('已停止');
    startButton.textContent = '開啟相機';
    startButton.onclick = startCamera;
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
            updateStatus(`偵測到 ${predictions.length} 個人臉`, 'success');

            // 步驟 3: 在偵測到的人臉位置繪製 Jenson head
            predictions.forEach((prediction) => {
                // 取得人臉位置
                const start = prediction.topLeft;
                const end = prediction.bottomRight;
                const size = [end[0] - start[0], end[1] - start[1]];

                // 計算 Jenson head 圖片的長寬比
                const jensonAspectRatio = jensonHeadImage.width / jensonHeadImage.height;

                // 擴大範圍以覆蓋整個頭部（增加 75%）
                const expandRatio = 1.75;
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
            updateStatus('未偵測到人臉');
        }
    } catch (error) {
        console.error('偵測錯誤:', error);
    }
}

// 綁定按鈕事件
startButton.addEventListener('click', startCamera);
startButton.disabled = true;

// 啟動應用程式
init().catch(error => {
    updateStatus('初始化失敗: ' + error.message, 'error');
});
