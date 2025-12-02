/**
 * Vision service for plant genus detection using Transformers.js (on-device inference).
 * Uses ONNX Runtime Web to run the Vision Transformer model directly in React Native.
 */
import { env } from '@xenova/transformers';
import { downloadModel, loadLabelMappings, isModelCached, getModelPath } from './modelLoader';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import UPNG from 'upng-js';

// Configure Transformers.js for React Native
env.useBrowserCache = false;
env.allowLocalModels = true;
env.allowRemoteModels = true;

// Global model and processor instances (loaded once)
let model = null;
let processor = null;
let labelMappings = null;

// Model state
let isInitialized = false;
let isInitializing = false;

/**
 * Initialize the model and processor
 * This is called automatically on first inference, or can be called manually to preload
 *
 * @param {function} onProgress - Optional progress callback (progress: 0-1)
 */
export async function initializeModel(onProgress) {
  if (isInitialized) {
    console.log('[VisionService] Model already initialized');
    return;
  }

  if (isInitializing) {
    console.log('[VisionService] Model initialization in progress');
    // Wait for current initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  try {
    isInitializing = true;
    console.log('[VisionService] Initializing model...');

    // Step 1: Download model if not cached (95% of progress)
    const isCached = await isModelCached();
    if (!isCached) {
      console.log('[VisionService] Model not cached, downloading...');
      await downloadModel((downloadProgress, totalProgress) => {
        if (onProgress) {
          onProgress(totalProgress * 0.95);
        }
      });
    } else {
      console.log('[VisionService] Using cached model');
      if (onProgress) onProgress(0.95);
    }

    // Step 2: Load label mappings
    labelMappings = await loadLabelMappings();
    console.log(`[VisionService] Loaded ${Object.keys(labelMappings.id_to_genus).length} genus labels`);

    // Step 3: Load the model using Transformers.js
    // Note: For now, we'll use a simpler approach with manual ONNX loading
    // since custom models may need special handling
    const modelPath = await getModelPath();
    console.log(`[VisionService] Model path: ${modelPath}`);

    // For Transformers.js, we use the built-in image classification pipeline
    // This is a simplified version - if your model needs custom handling,
    // we'll implement direct ONNX Runtime Web usage
    console.log('[VisionService] Loading model with Transformers.js...');

    // Note: Since this is a custom model, we'll use a direct ONNX approach
    // in the detectPlantGenus function. Transformers.js doesn't easily support
    // custom ONNX models without full HuggingFace format.

    if (onProgress) onProgress(1.0);

    isInitialized = true;
    isInitializing = false;
    console.log('[VisionService] Model initialized successfully');

  } catch (error) {
    isInitializing = false;
    console.error('[VisionService] Error initializing model:', error);
    throw new Error(`Failed to initialize model: ${error.message}`);
  }
}

/**
 * Preprocess image for Vision Transformer
 *
 * @param {string} imageUri - URI of the image
 * @returns {Promise<Float32Array>} Preprocessed image data
 */
async function preprocessImage(imageUri) {
  try {
    console.log('[VisionService] Resizing image to 224x224...');

    // Step 1: Resize image to 224x224 using expo-image-manipulator
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 224, height: 224 } }],
      { format: ImageManipulator.SaveFormat.PNG }
    );

    console.log('[VisionService] Reading PNG file...');

    // Step 2: Read the PNG file as base64
    const base64Data = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('[VisionService] Decoding PNG data...');

    // Step 3: Decode base64 to Uint8Array and parse PNG
    // Convert base64 to binary string, then to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode PNG using UPNG (pure JS, no Node dependencies, better React Native support)
    const png = UPNG.decode(bytes.buffer);

    console.log('[VisionService] Applying ImageNet normalization...');

    // ImageNet normalization constants
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    // Create Float32Array for model input (1, 3, 224, 224)
    const inputData = new Float32Array(1 * 3 * 224 * 224);

    // Convert UPNG data to RGBA format
    // UPNG.toRGBA8 returns a flat Uint8Array with RGBA values
    const width = png.width;
    const height = png.height;
    const rgbaData = new Uint8Array(UPNG.toRGBA8(png)[0]);

    // Process each pixel and convert to NCHW format (channels first)
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const pixelIndex = (i * width + j) * 4; // RGBA has 4 channels
        const outputIndex = i * width + j;

        // Extract RGB values (0-255) and normalize to [0, 1]
        const r = rgbaData[pixelIndex] / 255.0;
        const g = rgbaData[pixelIndex + 1] / 255.0;
        const b = rgbaData[pixelIndex + 2] / 255.0;

        // Apply ImageNet normalization and store in NCHW format
        inputData[0 * 224 * 224 + outputIndex] = (r - mean[0]) / std[0]; // R channel
        inputData[1 * 224 * 224 + outputIndex] = (g - mean[1]) / std[1]; // G channel
        inputData[2 * 224 * 224 + outputIndex] = (b - mean[2]) / std[2]; // B channel
      }
    }

    console.log('[VisionService] Image preprocessed successfully');
    return inputData;

  } catch (error) {
    console.error('[VisionService] Error preprocessing image:', error);
    throw new Error(`Failed to preprocess image: ${error.message}`);
  }
}

/**
 * Run inference using ONNX Runtime React Native
 *
 * @param {Float32Array} inputData - Preprocessed image data
 * @returns {Promise<Float32Array>} Model output probabilities
 */
async function runInference(inputData) {
  try {
    // Import ONNX Runtime React Native
    const ort = require('onnxruntime-react-native');

    // Get model path
    const modelPath = await getModelPath();

    console.log(`[VisionService] Creating inference session from ${modelPath}...`);

    // Create inference session with options to handle FP16
    const sessionOptions = {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      executionMode: 'sequential',
    };

    const session = await ort.InferenceSession.create(modelPath, sessionOptions);

    console.log('[VisionService] Creating input tensor...');

    // Create input tensor
    const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 224, 224]);

    console.log('[VisionService] Running model inference...');

    // Run inference
    const feeds = { input: inputTensor };
    const results = await session.run(feeds);

    console.log('[VisionService] Inference complete, extracting output...');

    // Get output (logits)
    const output = results[Object.keys(results)[0]];

    return output.data;

  } catch (error) {
    console.error('[VisionService] Error running inference:', error);
    throw new Error(`Failed to run inference: ${error.message}`);
  }
}

/**
 * Apply softmax to convert logits to probabilities
 *
 * @param {Float32Array} logits - Raw model outputs
 * @returns {Float32Array} Probabilities
 */
function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const expScores = Array.from(logits).map(x => Math.exp(x - maxLogit));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  return new Float32Array(expScores.map(x => x / sumExp));
}

/**
 * Detect plant genus from an image using the Vision Transformer model.
 *
 * @param {string} imageUri - URI of the image to analyze
 * @param {number} confidenceThreshold - Minimum confidence (default: 0.7)
 * @returns {Promise<string|null>} - Returns genus name if detected with sufficient confidence, otherwise null
 */
export async function detectPlantGenus(imageUri, confidenceThreshold = 0.7) {
  try {
    console.log('[VisionService] Starting genus detection...');

    // Ensure model is initialized
    if (!isInitialized) {
      console.log('[VisionService] Model not initialized, initializing now...');
      await initializeModel();
    }

    // Step 1: Preprocess image
    console.log('[VisionService] Preprocessing image...');
    const inputData = await preprocessImage(imageUri);

    // Step 2: Run inference
    console.log('[VisionService] Running inference...');
    const logits = await runInference(inputData);

    // Step 3: Apply softmax to get probabilities
    const probabilities = softmax(logits);

    // Step 4: Get top prediction
    let maxProb = 0;
    let maxIndex = 0;

    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    console.log(`[VisionService] Top prediction: index=${maxIndex}, confidence=${maxProb.toFixed(4)}`);

    // Step 5: Check confidence threshold
    if (maxProb < confidenceThreshold) {
      console.log(`[VisionService] Confidence ${maxProb.toFixed(4)} below threshold ${confidenceThreshold}`);
      return null;
    }

    // Step 6: Get genus name from label mapping
    const genusName = labelMappings.id_to_genus[maxIndex];

    if (!genusName) {
      console.warn(`[VisionService] No genus found for index ${maxIndex}`);
      return null;
    }

    console.log(`[VisionService] Detected genus: ${genusName} (confidence: ${(maxProb * 100).toFixed(2)}%)`);

    return genusName;

  } catch (error) {
    console.error('[VisionService] Error detecting genus:', error);
    throw new Error(`Failed to detect genus: ${error.message}`);
  }
}

/**
 * Check if the model is ready for inference
 *
 * @returns {boolean}
 */
export function isModelReady() {
  return isInitialized;
}

/**
 * Get model initialization status
 *
 * @returns {{initialized: boolean, initializing: boolean, cached: boolean}}
 */
export async function getModelStatus() {
  const cached = await isModelCached();
  return {
    initialized: isInitialized,
    initializing: isInitializing,
    cached,
  };
}
