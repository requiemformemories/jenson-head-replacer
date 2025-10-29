// Face detection and smoothing algorithms

import { video, model, isDetecting, lastPredictions, setLastPredictions } from './state.js';
import { config } from './config.js';
import { t } from './i18n.js';
import { updateStatus } from './ui.js';

// Smooth predictions using exponential moving average (EMA)
function smoothPredictions(newPredictions) {
    if (lastPredictions.length === 0) {
        // First detection, no smoothing needed
        return newPredictions;
    }

    // If number of faces changed, reset smoothing
    if (newPredictions.length !== lastPredictions.length) {
        return newPredictions;
    }

    return newPredictions.map((newPred, index) => {
        const lastPred = lastPredictions[index];
        if (!lastPred) return newPred;

        // Check for sudden large jumps (outlier detection)
        const newCenter = [
            (newPred.topLeft[0] + newPred.bottomRight[0]) / 2,
            (newPred.topLeft[1] + newPred.bottomRight[1]) / 2
        ];
        const lastCenter = [
            (lastPred.topLeft[0] + lastPred.bottomRight[0]) / 2,
            (lastPred.topLeft[1] + lastPred.bottomRight[1]) / 2
        ];

        const distance = Math.sqrt(
            Math.pow(newCenter[0] - lastCenter[0], 2) +
            Math.pow(newCenter[1] - lastCenter[1], 2)
        );

        // If jump is too large, it might be a detection error, use more of the old position
        const effectiveSmoothingFactor = distance > config.maxPositionJump
            ? config.smoothingFactor * 0.3  // Use only 30% of new position if jump is large
            : config.smoothingFactor;

        // Apply exponential moving average
        return {
            topLeft: [
                lastPred.topLeft[0] * (1 - effectiveSmoothingFactor) + newPred.topLeft[0] * effectiveSmoothingFactor,
                lastPred.topLeft[1] * (1 - effectiveSmoothingFactor) + newPred.topLeft[1] * effectiveSmoothingFactor
            ],
            bottomRight: [
                lastPred.bottomRight[0] * (1 - effectiveSmoothingFactor) + newPred.bottomRight[0] * effectiveSmoothingFactor,
                lastPred.bottomRight[1] * (1 - effectiveSmoothingFactor) + newPred.bottomRight[1] * effectiveSmoothingFactor
            ],
            landmarks: newPred.landmarks,
            probability: newPred.probability
        };
    });
}

// Detect faces (runs at lower FPS)
export async function detectFaces() {
    if (!isDetecting) return;

    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
    }

    try {
        // Detect faces from video
        const predictions = await model.estimateFaces(video, false);

        if (predictions.length > 0) {
            // Apply smoothing and boundary checking
            const smoothedPredictions = smoothPredictions(predictions);
            setLastPredictions(smoothedPredictions);

            updateStatus(t('statusDetecting', { count: predictions.length }), 'success');
        } else {
            setLastPredictions([]);
            updateStatus(t('statusNoFace'));
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
}
