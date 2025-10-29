// Main application entry point

import { setVideo, setCanvas, setCtx, setModel, setJensonHeadImage } from './modules/state.js';
import { loadLanguagePreference, t } from './modules/i18n.js';
import { initializeUI, updateStatus, enableStartButton } from './modules/ui.js';

// Initialize application
async function init() {
    // Get DOM elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Set state references
    setVideo(video);
    setCanvas(canvas);
    setCtx(ctx);

    // Load language preference
    loadLanguagePreference();

    // Initialize UI event listeners
    initializeUI();

    // Load Jenson head image
    updateStatus(t('statusLoadingImage'));
    const jensonHeadImage = new Image();
    jensonHeadImage.src = 'jenson_head.webp';

    try {
        await new Promise((resolve, reject) => {
            jensonHeadImage.onload = () => {
                console.log('Jenson head image loaded:', jensonHeadImage.width, 'x', jensonHeadImage.height);
                resolve();
            };
            jensonHeadImage.onerror = (e) => {
                console.error('Image load error:', e);
                reject(new Error('Failed to load jenson_head.webp'));
            };
        });
        setJensonHeadImage(jensonHeadImage);
        updateStatus(t('statusImageLoaded'));
    } catch (error) {
        updateStatus(t('errorImageLoad') + ': ' + error.message, 'error');
        return;
    }

    // Load face detection model
    updateStatus(t('statusLoadingModel'));
    try {
        const model = await blazeface.load();
        setModel(model);
        updateStatus(t('statusModelLoaded'), 'success');
        enableStartButton();
    } catch (error) {
        updateStatus(t('errorModelLoad') + ': ' + error.message, 'error');
    }
}

// Start application
init().catch(error => {
    updateStatus(t('errorInit') + ': ' + error.message, 'error');
});
