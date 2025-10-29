// Global application state

// Video and canvas elements
export let video = null;
export let canvas = null;
export let ctx = null;

// BlazeFace model
export let model = null;

// Jenson head image
export let jensonHeadImage = null;

// Detection state
export let isDetecting = false;
export let detectionInterval = null;
export let renderInterval = null;

// Camera stream
export let currentStream = null;

// Last face detection results
export let lastPredictions = [];

// Current language
export let currentLang = 'en';

// State setters
export function setVideo(element) {
    video = element;
}

export function setCanvas(element) {
    canvas = element;
}

export function setCtx(context) {
    ctx = context;
}

export function setModel(m) {
    model = m;
}

export function setJensonHeadImage(img) {
    jensonHeadImage = img;
}

export function setIsDetecting(value) {
    isDetecting = value;
}

export function setDetectionInterval(interval) {
    detectionInterval = interval;
}

export function setRenderInterval(interval) {
    renderInterval = interval;
}

export function setCurrentStream(stream) {
    currentStream = stream;
}

export function setLastPredictions(predictions) {
    lastPredictions = predictions;
}

export function setCurrentLang(lang) {
    currentLang = lang;
}
