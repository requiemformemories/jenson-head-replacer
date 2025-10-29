// Canvas rendering module

import { video, canvas, ctx, isDetecting, jensonHeadImage, lastPredictions } from './state.js';
import { config } from './config.js';

// Render frame (runs at 60 FPS)
export function render() {
    if (!isDetecting) return;

    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
    }

    // Draw entire video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw Jenson heads using stored predictions
    if (lastPredictions.length > 0) {
        lastPredictions.forEach((prediction) => {
            // Get face position
            const start = prediction.topLeft;
            const end = prediction.bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];

            // Calculate Jenson head image aspect ratio
            const jensonAspectRatio = jensonHeadImage.width / jensonHeadImage.height;

            // Use configurable expansion range
            const faceWidth = size[0] * config.expandRatio;

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
    }
}
