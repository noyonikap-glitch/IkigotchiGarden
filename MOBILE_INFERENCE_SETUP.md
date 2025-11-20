# Mobile Inference Setup Guide - Transformers.js

This guide explains how to set up on-device plant genus detection using Transformers.js in your Expo app.

## Overview

The implementation uses:
- **@xenova/transformers** - For image preprocessing and utilities
- **onnxruntime-web** - For running ONNX models in React Native
- **expo-file-system** - For downloading and caching the model
- Your existing **plant_genus_vit_fp16.onnx** model (no conversion needed!)

## Installation Complete ✅

All necessary packages have been installed:
```bash
✓ @xenova/transformers
✓ onnxruntime-web
✓ expo-file-system
✓ expo-asset
```

## Next Steps

### Step 1: Host Your Model Files

You need to host two files publicly:
1. `model_fp16.onnx` (42 MB) - Your Vision Transformer model
2. `label_mapping.json` - Your genus-to-ID mapping

**Hosting Options:**

**Option A: GitHub Releases (Recommended for testing)**
1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Upload both files as release assets
4. Copy the download URLs

**Option B: Firebase Storage**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init storage

# Upload files
firebase deploy --only storage
```

**Option C: Your Own Server**
Simply place the files in a publicly accessible directory.

**Option D: CDN (Cloudflare R2, AWS S3, etc.)**
Upload to any CDN service and get public URLs.

### Step 2: Update Model URLs

Edit `utils/modelLoader.js` and update the URLs:

```javascript
const MODEL_CONFIG = {
  modelUrl: 'https://your-actual-url.com/model_fp16.onnx',
  labelsUrl: 'https://your-actual-url.com/label_mapping.json',
  // ... rest stays the same
};
```

### Step 3: Test the Implementation

Run your app:
```bash
npm start
```

Navigate to a plant's edit screen and click "Detect Genus". On first use:
1. The model will download (~42 MB) - this may take 30-60 seconds
2. Model is cached locally for future use
3. Inference runs on-device (2-5 seconds)

## File Structure

```
utils/
├── visionService.js       # Main inference logic (Transformers.js + ONNX Runtime)
├── modelLoader.js         # Model download and caching
└── geminiService.js       # Existing Gemini AI service

backend/
└── models/
    ├── plant_genus_vit_fp16.onnx      # Copy these files to your hosting
    └── label_mapping.json              # for public access
```

## How It Works

### First Use (Model Download):
1. User clicks "Detect Genus"
2. App checks if model is cached
3. If not, downloads from your CDN
4. Caches in `FileSystem.cacheDirectory`
5. Loads label mappings
6. Runs inference

### Subsequent Uses:
1. User clicks "Detect Genus"
2. Loads cached model instantly
3. Preprocesses image (224x224, ImageNet normalization)
4. Runs ONNX inference via onnxruntime-web
5. Returns genus if confidence ≥ 0.4

## Configuration

### Adjust Confidence Threshold

In `visionService.js`, the default is 0.4 (40%):

```javascript
export async function detectPlantGenus(imageUri, confidenceThreshold = 0.4) {
  // ... inference logic
}
```

You can change this in `EditPlantScreen.js`:

```javascript
const genus = await detectPlantGenus(imageUri, 0.5); // 50% threshold
```

### Model Download Progress

The current implementation downloads silently. To show progress:

```javascript
// In EditPlantScreen.js, update handleDetectGenus:

import { initializeModel, detectPlantGenus, isModelReady } from '../utils/visionService';

const handleDetectGenus = async () => {
  try {
    setLoading(true);

    // Check if model needs download
    const isReady = isModelReady();

    if (!isReady) {
      // Show download progress
      await initializeModel((progress) => {
        console.log(`Model download: ${(progress * 100).toFixed(0)}%`);
        // Could update a progress bar here
      });
    }

    // ... rest of your code
  } catch (error) {
    // ... error handling
  }
};
```

## Performance

Expected performance on modern devices:

| Device | First Run (with download) | Subsequent Runs |
|--------|---------------------------|-----------------|
| iPhone 12+ | 45-60s | 2-3s |
| iPhone 11/XR | 60-90s | 3-4s |
| Android (high-end) | 50-70s | 2-4s |
| Android (mid-range) | 70-120s | 4-6s |

**First run includes:**
- Model download (~42 MB)
- Model initialization
- Image preprocessing
- Inference

**Subsequent runs:**
- Cached model (instant load)
- Image preprocessing
- Inference

## Troubleshooting

### Model Not Downloading
**Error:** "Failed to download model"

**Solutions:**
1. Check that URLs in `modelLoader.js` are correct and publicly accessible
2. Test URLs in browser - should download the files
3. Check network connection
4. Look at console logs for specific error

### Out of Memory
**Error:** App crashes during inference

**Solutions:**
1. This is rare but possible on very old devices
2. Reduce image quality before sending to model
3. Clear app cache: `expo r -c`

### Slow Inference (>10 seconds)
**Causes:**
- Old/low-end device
- Model not cached (re-downloading)
- Background processes

**Solutions:**
1. Ensure model is cached (check with `isModelCached()`)
2. Test on newer device
3. Close other apps

### Wrong Predictions
**Causes:**
- Preprocessing mismatch
- Model file corrupted
- Wrong label mapping

**Solutions:**
1. Verify label_mapping.json matches your training data
2. Re-download model files
3. Check preprocessing matches backend exactly

### "Cannot find module 'onnxruntime-web'"
**Solution:**
```bash
npm install onnxruntime-web
```

## Comparing with Backend API

To verify on-device inference matches backend:

1. Test same image on both
2. Check console logs for prediction indices
3. Confidence scores should match within 0.01

Example test:
```javascript
// Test image URI
const testImage = 'file:///path/to/test/oak.jpg';

// Backend API
const backendResult = await fetch('http://localhost:3001/api/vision/detect-genus', {
  method: 'POST',
  body: formData,
});

// On-device
const onDeviceResult = await detectPlantGenus(testImage);

// Compare
console.log('Backend:', await backendResult.json());
console.log('On-device:', onDeviceResult);
```

## Model Updates

To update the model:

1. Train new model
2. Convert to ONNX (FP16)
3. Upload to hosting
4. Update URLs in `modelLoader.js`
5. Clear app cache: `await clearModelCache()` (from modelLoader.js)
6. App will download new version on next use

## Cache Management

The model is cached in:
```
${FileSystem.cacheDirectory}models/
├── plant_genus_vit_fp16.onnx
└── label_mapping.json
```

**Cache size:** ~42 MB

**To clear cache:**
```javascript
import { clearModelCache } from './utils/modelLoader';

await clearModelCache();
```

**Cache persists:**
- Between app restarts
- Until app is uninstalled or cache is cleared

## Offline Capability

✅ **Works 100% offline** after first download!

1. First use: Requires internet to download model
2. All subsequent uses: Completely offline
3. Model stays cached until app uninstall

## Bundle Size Impact

**App bundle increase:** ~8-10 MB (just the libraries)
**Model:** Downloaded separately (~42 MB cached locally)

**Total disk usage:** ~50-52 MB

## Production Checklist

Before releasing:

- [ ] Model files hosted on reliable CDN
- [ ] URLs updated in `modelLoader.js`
- [ ] Tested on both iOS and Android
- [ ] Tested first-time download experience
- [ ] Tested cached model performance
- [ ] Tested offline functionality
- [ ] Error handling tested (network failures, etc.)
- [ ] Verified predictions match backend
- [ ] Loading states implemented
- [ ] Progress indicators added (optional)

## Support

If you encounter issues:
1. Check console logs (lots of `[VisionService]` and `[ModelLoader]` logs)
2. Verify model URLs are accessible
3. Test with `expo start -c` (clear cache)
4. Check device has enough storage (~100 MB free recommended)

## Next Enhancement Ideas

1. **Download progress UI** - Show download percentage
2. **Model preloading** - Download on app startup
3. **Batch inference** - Process multiple images
4. **Model versioning** - Auto-update to latest model
5. **Compression** - Use gzip for model download
6. **Fallback** - Use backend API if on-device fails

---

You're all set! Just host your model files and update the URLs in `modelLoader.js`.
