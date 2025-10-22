let video;
let canvas;
let ctx;
let model;
let jensonHeadImage;
let isDetecting = false;

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
    jensonHeadImage = new Image();
    jensonHeadImage.src = 'jenson_head.webp';
    await new Promise((resolve, reject) => {
        jensonHeadImage.onload = resolve;
        jensonHeadImage.onerror = () => reject(new Error('無法載入 jenson_head.webp'));
    });

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
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        video.srcObject = stream;

        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            updateStatus('相機已開啟，正在偵測人臉...', 'success');
            startButton.textContent = '停止';
            startButton.onclick = stopCamera;
            isDetecting = true;
            detectFaces();
        });
    } catch (error) {
        updateStatus('無法存取相機: ' + error.message, 'error');
    }
}

// 停止相機
function stopCamera() {
    isDetecting = false;
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

    // 清除 canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        // 偵測人臉
        const predictions = await model.estimateFaces(video, false);

        if (predictions.length > 0) {
            updateStatus(`偵測到 ${predictions.length} 個人臉`, 'success');

            predictions.forEach(prediction => {
                // 取得人臉位置
                const start = prediction.topLeft;
                const end = prediction.bottomRight;
                const size = [end[0] - start[0], end[1] - start[1]];

                // 擴大範圍以覆蓋整個頭部（增加 50%）
                const expandRatio = 1.5;
                const expandedWidth = size[0] * expandRatio;
                const expandedHeight = size[1] * expandRatio;
                const offsetX = (expandedWidth - size[0]) / 2;
                const offsetY = (expandedHeight - size[1]) / 2;

                // 繪製 Jenson head 圖片
                ctx.drawImage(
                    jensonHeadImage,
                    start[0] - offsetX,
                    start[1] - offsetY,
                    expandedWidth,
                    expandedHeight
                );

                // 可選：繪製偵測框（除錯用）
                // ctx.strokeStyle = '#00ff00';
                // ctx.lineWidth = 2;
                // ctx.strokeRect(start[0], start[1], size[0], size[1]);
            });
        } else {
            updateStatus('未偵測到人臉');
        }
    } catch (error) {
        console.error('偵測錯誤:', error);
    }

    // 繼續偵測
    requestAnimationFrame(detectFaces);
}

// 綁定按鈕事件
startButton.addEventListener('click', startCamera);
startButton.disabled = true;

// 啟動應用程式
init().catch(error => {
    updateStatus('初始化失敗: ' + error.message, 'error');
});
