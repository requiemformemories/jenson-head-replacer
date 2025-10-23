# Jenson Head Replacer

A real-time web application that replaces detected faces in camera feed with Jenson head image.

## Features

- Real-time camera access
- Automatic face detection (using TensorFlow.js BlazeFace model)
- Live face replacement with custom image
- Multiple faces support
- Responsive design

## Tech Stack

```
Frontend:
├── HTML5 (Structure)
├── CSS3 (Styling)
└── JavaScript (Logic)

Libraries:
├── TensorFlow.js (Machine Learning Framework)
└── BlazeFace (Lightweight Face Detection Model)

Browser APIs:
├── WebRTC (getUserMedia - Camera Access)
└── Canvas API (Image Processing & Rendering)
```

## Project Structure

```
jenson_head/
├── index.html          # Main HTML page
├── style.css           # Stylesheet
├── app.js              # JavaScript main application
├── jenson_head.webp    # Image for face replacement
└── README.md           # Documentation
```

## Installation & Setup

### Prerequisites

1. An image named `jenson_head.webp` (place in project root directory)
2. A modern web browser (Chrome, Firefox, Edge, etc.)
3. A local web server (camera access requires HTTPS or localhost)

### How to Run

#### Method 1: Using Python Built-in Server

```bash
# Python 3
python3 -m http.server 8000

# Then open in browser
# http://localhost:8000
```

#### Method 2: Using Node.js http-server

```bash
# Install http-server (if not already installed)
npm install -g http-server

# Start server
http-server -p 8000

# Then open in browser
# http://localhost:8000
```

#### Method 3: Using VS Code Live Server Extension

1. Install "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Usage

1. Open the web page, the application will automatically load the face detection model
2. **(Optional) Configure settings:**
   - Click "⚙️ 設定" to expand the configuration panel
   - Upload your own image to replace faces
   - Adjust the size ratio with the slider (1.0x - 3.0x)
   - Click "重置為預設值" to restore defaults
3. Click the "開啟相機" (Start Camera) button
4. Allow browser camera permission
5. After camera starts, the app will automatically detect faces in the frame
6. Detected faces will be replaced with your chosen image in real-time
7. Click "重啟" (Reset) button to restart the camera

## How It Works

1. **Camera Access**: Uses WebRTC's `getUserMedia` API to obtain camera stream
2. **Face Detection**: Uses TensorFlow.js BlazeFace model to detect face positions every frame
3. **Image Replacement**: Draws camera feed on Canvas and replaces detected face areas with custom image
4. **Real-time Rendering**: Uses `requestAnimationFrame` for smooth real-time rendering

## Customization

### Change Replacement Image (Easy Way - No Code)

1. Click "⚙️ 設定" to open the settings panel
2. Click "上傳替換圖片" and select your image
3. The new image will be used immediately

### Adjust Replacement Size (Easy Way - No Code)

1. Click "⚙️ 設定" to open the settings panel
2. Use the "圖片大小比例" slider to adjust size
3. Range: 1.0x (original face size) to 3.0x (3 times larger)

### Reset to Defaults

Click "重置為預設值" button in the settings panel to restore:
- Default jenson_head.webp image
- Default size ratio (1.75x)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Required browser features:
- WebRTC (getUserMedia)
- Canvas API
- ES6+ JavaScript
- WebGL (for TensorFlow.js)

## Notes

- This application requires camera permission to function
- HTTPS or localhost environment recommended
- Face detection performance depends on device performance
- Recommended to use newer computers for better performance

## Troubleshooting

**Issue: Camera won't open**
- Confirm browser has granted camera permission
- Ensure using HTTPS or localhost
- Check if another application is using the camera

**Issue: Model loading failed**
- Confirm internet connection is stable (model loads from CDN)
- Try refreshing the page

**Issue: Poor detection performance**
- Ensure adequate lighting
- Lower video resolution
- Try using a newer device

## License

This project is an educational example and free to use and modify.

## Credits

- TensorFlow.js Team
- BlazeFace Model Developers
