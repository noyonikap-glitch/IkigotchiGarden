/**
 * Model loader utility for downloading and caching the ONNX model
 * and label mappings for Transformers.js
 */
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Model configuration
// TODO: Replace with your actual model hosting URL
const MODEL_CONFIG = {
  modelUrl: 'https://github.com/nf317881/IkigotchiVision/releases/download/test3/model_fp32.onnx',
  labelsUrl: 'https://github.com/nf317881/IkigotchiVision/releases/download/new_flag/label_mapping.json',
  modelFileName: 'plant_genus_vit_fp32.onnx',
  labelsFileName: 'label_mapping.json',
};

// Cache directory
const CACHE_DIR = `${FileSystem.cacheDirectory}models/`;
const MODEL_PATH = `${CACHE_DIR}${MODEL_CONFIG.modelFileName}`;
const LABELS_PATH = `${CACHE_DIR}${MODEL_CONFIG.labelsFileName}`;

/**
 * Initialize the cache directory
 */
async function initCacheDirectory() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    console.log('[ModelLoader] Creating cache directory');
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

/**
 * Download a file with progress tracking
 */
async function downloadFile(url, destination, onProgress) {
  console.log(`[ModelLoader] Downloading ${url} to ${destination}`);

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    destination,
    {},
    onProgress
  );

  const result = await downloadResumable.downloadAsync();
  return result;
}

/**
 * Check if model files are cached
 */
export async function isModelCached() {
  const modelInfo = await FileSystem.getInfoAsync(MODEL_PATH);
  const labelsInfo = await FileSystem.getInfoAsync(LABELS_PATH);
  return modelInfo.exists && labelsInfo.exists;
}

/**
 * Get the size of cached model files
 */
export async function getCachedModelSize() {
  try {
    const modelInfo = await FileSystem.getInfoAsync(MODEL_PATH);
    const labelsInfo = await FileSystem.getInfoAsync(LABELS_PATH);

    if (modelInfo.exists && labelsInfo.exists) {
      return {
        modelSize: modelInfo.size,
        labelsSize: labelsInfo.size,
        totalSize: modelInfo.size + labelsInfo.size,
      };
    }
  } catch (error) {
    console.error('[ModelLoader] Error getting cached model size:', error);
  }
  return null;
}

/**
 * Download and cache the model and label files
 *
 * @param {function} onProgress - Progress callback (downloadProgress, totalProgress)
 * @returns {Promise<{modelPath: string, labelsPath: string}>}
 */
export async function downloadModel(onProgress) {
  try {
    await initCacheDirectory();

    // Check if already cached
    if (await isModelCached()) {
      console.log('[ModelLoader] Model already cached');
      if (onProgress) {
        onProgress(1, 1); // 100% progress
      }
      return { modelPath: MODEL_PATH, labelsPath: LABELS_PATH };
    }

    console.log('[ModelLoader] Starting model download...');

    // Download model
    await downloadFile(
      MODEL_CONFIG.modelUrl,
      MODEL_PATH,
      (downloadProgress) => {
        if (onProgress) {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress(progress, progress * 0.95); // Model is 95% of total download
        }
      }
    );

    // Download labels
    await downloadFile(
      MODEL_CONFIG.labelsUrl,
      LABELS_PATH,
      (downloadProgress) => {
        if (onProgress) {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress(progress, 0.95 + (progress * 0.05)); // Labels are last 5%
        }
      }
    );

    console.log('[ModelLoader] Model download completed');

    if (onProgress) {
      onProgress(1, 1);
    }

    return { modelPath: MODEL_PATH, labelsPath: LABELS_PATH };
  } catch (error) {
    console.error('[ModelLoader] Error downloading model:', error);
    throw new Error(`Failed to download model: ${error.message}`);
  }
}

/**
 * Load label mappings from cache
 *
 * @returns {Promise<{id_to_genus: Object, genus_to_id: Object}>}
 */
export async function loadLabelMappings() {
  try {
    const labelsInfo = await FileSystem.getInfoAsync(LABELS_PATH);

    if (!labelsInfo.exists) {
      throw new Error('Label mappings not cached. Download model first.');
    }

    const labelsJson = await FileSystem.readAsStringAsync(LABELS_PATH);
    const data = JSON.parse(labelsJson);

    // Create id_to_genus mapping
    const id_to_genus = {};
    Object.entries(data.genus_to_id).forEach(([genus, id]) => {
      id_to_genus[id] = genus;
    });

    return {
      id_to_genus,
      genus_to_id: data.genus_to_id,
    };
  } catch (error) {
    console.error('[ModelLoader] Error loading label mappings:', error);
    throw new Error(`Failed to load label mappings: ${error.message}`);
  }
}

/**
 * Get the local path to the cached model
 *
 * @returns {Promise<string>} - Path to the ONNX model file
 */
export async function getModelPath() {
  const modelInfo = await FileSystem.getInfoAsync(MODEL_PATH);

  if (!modelInfo.exists) {
    throw new Error('Model not cached. Download model first.');
  }

  return MODEL_PATH;
}

/**
 * Clear cached model files
 */
export async function clearModelCache() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      console.log('[ModelLoader] Model cache cleared');
    }
  } catch (error) {
    console.error('[ModelLoader] Error clearing cache:', error);
    throw error;
  }
}

/**
 * Get model info
 */
export function getModelInfo() {
  return {
    modelUrl: MODEL_CONFIG.modelUrl,
    expectedSize: '84 MB',
    format: 'ONNX FP32',
    cachedPath: MODEL_PATH,
  };
}
