// Internationalization (i18n) module

import { currentLang, setCurrentLang } from './state.js';

// Translations for all supported languages
const translations = {
    'zh-TW': {
        title: 'Jenson Head Replacer',
        settings: '設定',
        uploadLabel: '上傳替換圖片：',
        uploadHint: '選擇要替換人臉的圖片',
        sizeLabel: '圖片大小比例：',
        sizeHint: '調整替換圖片的大小（1.0 = 原始人臉大小）',
        detectionFPSLabel: '偵測頻率：',
        detectionFPSHint: '調整臉部偵測頻率（越低越穩定但反應較慢）',
        smoothingLabel: '平滑強度：',
        smoothingHint: '調整位置平滑程度（越低越穩定但反應較慢）',
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
        detectionFPSLabel: 'Detection FPS:',
        detectionFPSHint: 'Adjust face detection frequency (lower = more stable but slower response)',
        smoothingLabel: 'Smoothing Strength:',
        smoothingHint: 'Adjust position smoothing (lower = more stable but slower response)',
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
export function t(key, params = {}) {
    let text = translations[currentLang][key] || key;
    // Replace parameters
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

// Update page language
export function updateLanguage(lang) {
    setCurrentLang(lang);

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

// Load saved language preference
export function loadLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    updateLanguage(savedLang);
}
