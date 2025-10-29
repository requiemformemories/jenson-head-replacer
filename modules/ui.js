// UI control and event handling module

import { setJensonHeadImage, isDetecting, detectionInterval, setDetectionInterval } from './state.js';
import { config, resetConfig as resetConfigValues } from './config.js';
import { t, updateLanguage } from './i18n.js';
import { startCamera } from './camera.js';
import { detectFaces } from './detection.js';

// DOM element references
const startButton = document.getElementById('startButton');
const statusDiv = document.getElementById('status');
const imageUpload = document.getElementById('imageUpload');
const expandRatioSlider = document.getElementById('expandRatio');
const ratioValue = document.getElementById('ratioValue');
const detectionFPSSlider = document.getElementById('detectionFPSSlider');
const detectionFPSValue = document.getElementById('detectionFPSValue');
const smoothingSlider = document.getElementById('smoothingSlider');
const smoothingValue = document.getElementById('smoothingValue');
const resetConfigButton = document.getElementById('resetConfig');

// Export getters for DOM elements needed by other modules
export function getStartButton() {
    return startButton;
}

// Update status message
export function updateStatus(message, type = 'normal') {
    statusDiv.textContent = message;
    statusDiv.className = type === 'error' ? 'error' : type === 'success' ? 'success' : '';
}

// Initialize UI event listeners
export function initializeUI() {
    // Bind start button
    startButton.addEventListener('click', startCamera);
    startButton.disabled = true;

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
                        setJensonHeadImage(newImage);
                        console.log('New image loaded:', newImage.width, 'x', newImage.height);
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
        config.expandRatio = parseFloat(event.target.value);
        ratioValue.textContent = config.expandRatio.toFixed(2);
    });

    // Adjust detection FPS
    detectionFPSSlider.addEventListener('input', (event) => {
        config.detectionFPS = parseInt(event.target.value);
        detectionFPSValue.textContent = config.detectionFPS;

        // If detection is already running, restart the detection interval with new FPS
        if (isDetecting && detectionInterval) {
            clearInterval(detectionInterval);
            setDetectionInterval(setInterval(detectFaces, 1000 / config.detectionFPS));
            console.log(`Detection FPS updated to ${config.detectionFPS}`);
        }
    });

    // Adjust smoothing factor
    smoothingSlider.addEventListener('input', (event) => {
        config.smoothingFactor = parseFloat(event.target.value);
        smoothingValue.textContent = config.smoothingFactor.toFixed(2);
    });

    // Reset configuration
    resetConfigButton.addEventListener('click', async () => {
        // Reset config values
        resetConfigValues();

        // Update UI elements
        expandRatioSlider.value = config.expandRatio;
        ratioValue.textContent = config.expandRatio.toFixed(2);

        detectionFPSSlider.value = config.detectionFPS;
        detectionFPSValue.textContent = config.detectionFPS;

        smoothingSlider.value = config.smoothingFactor;
        smoothingValue.textContent = config.smoothingFactor.toFixed(2);

        // Restart detection interval with new FPS if running
        if (isDetecting && detectionInterval) {
            clearInterval(detectionInterval);
            setDetectionInterval(setInterval(detectFaces, 1000 / config.detectionFPS));
            console.log('Detection interval restarted with default FPS');
        }

        // Reload default image
        updateStatus(t('statusResetConfig'));
        const jensonHeadImage = new Image();
        jensonHeadImage.src = import.meta.env.BASE_URL + 'jenson_head.webp';

        await new Promise((resolve, reject) => {
            jensonHeadImage.onload = () => {
                setJensonHeadImage(jensonHeadImage);
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
}

// Enable start button (called after initialization is complete)
export function enableStartButton() {
    startButton.disabled = false;
}
