// Camera control module

import {
    video,
    canvas,
    ctx,
    currentStream,
    detectionInterval,
    renderInterval,
    setIsDetecting,
    setCurrentStream,
    setDetectionInterval,
    setRenderInterval,
    setLastPredictions
} from './state.js';
import { config } from './config.js';
import { t } from './i18n.js';
import { updateStatus, getStartButton } from './ui.js';
import { detectFaces } from './detection.js';
import { render } from './renderer.js';

// Start camera
export async function startCamera() {
    try {
        // Ensure previous camera is fully stopped
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            setCurrentStream(null);
        }

        // Clear previous intervals
        if (detectionInterval) {
            clearInterval(detectionInterval);
            setDetectionInterval(null);
        }
        if (renderInterval) {
            clearInterval(renderInterval);
            setRenderInterval(null);
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
        setCurrentStream(stream);

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

        // Start detection and rendering after playback begins
        console.log('Video playback started');
        updateStatus(t('statusCameraOpened'), 'success');

        const startButton = getStartButton();
        startButton.textContent = t('resetCameraButton');
        startButton.onclick = resetCamera;

        setIsDetecting(true);

        // Separate detection and rendering intervals
        // Render at 60 FPS for smooth display
        setRenderInterval(setInterval(render, 1000 / 60));
        // Detect at lower FPS to reduce jitter and CPU usage
        setDetectionInterval(setInterval(detectFaces, 1000 / config.detectionFPS));

        console.log(`Rendering at 60 FPS, detecting at ${config.detectionFPS} FPS`);

    } catch (error) {
        updateStatus(t('errorCameraAccess') + ': ' + error.message, 'error');
        // Cleanup
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            setCurrentStream(null);
        }
    }
}

// Reset camera
export async function resetCamera() {
    console.log('Resetting camera');

    updateStatus(t('statusResetting'));
    const startButton = getStartButton();
    startButton.disabled = true;

    // Set flag to false
    setIsDetecting(false);

    // Clear intervals
    if (detectionInterval) {
        clearInterval(detectionInterval);
        setDetectionInterval(null);
        console.log('Detection interval cleared');
    }
    if (renderInterval) {
        clearInterval(renderInterval);
        setRenderInterval(null);
        console.log('Render interval cleared');
    }

    // Clear stored predictions
    setLastPredictions([]);

    // Stop camera stream
    if (currentStream) {
        currentStream.getTracks().forEach(track => {
            track.stop();
            console.log('Stopped track:', track.kind);
        });
        setCurrentStream(null);
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
