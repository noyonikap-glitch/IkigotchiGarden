import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Get API key from expo-constants (works in both dev and production)
const API_KEY = Constants.expoConfig?.extra?.geminiApiKey;

if (!API_KEY) {
  console.error('[Gemini] GEMINI_API_KEY is not configured. Check app.config.js and EAS secrets.');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

/**
 * Converts image URI to base64 format for Gemini API
 */
async function uriToBase64(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Check plant species using Gemini 2.5 Flash Lite
 * @param {string} imageUri - URI of the plant image
 * @returns {Promise<string>} - Identified plant species
 */
export async function checkPlantSpecies(imageUri) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const base64Image = await uriToBase64(imageUri);

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };

    const prompt = "What species is this plant? Please provide only the common name and scientific name, \
                    being as specific as you can. Provide the common name first, followed by the scientific \
                    name in parentheses.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log(text);

    return text;
  } catch (error) {
    console.error('Error checking plant species:', error);
    throw new Error('Failed to identify plant species. Please try again.');
  }
}

/**
 * Check plant health using Gemini 2.5 Pro
 * @param {string} imageUri - URI of the plant image
 * @returns {Promise<string>} - Plant health assessment
 */
export async function checkPlantHealth(imageUri) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const base64Image = await uriToBase64(imageUri);

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };

    const prompt = "Is this plant healthy? Please analyze the plant's condition and provide a short summary \
                    of: 1) Overall health status, 2) Any visible issues or diseases, 3) Recommendations \
                    for care if needed. Note that the message will displayed as ASCII text.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error checking plant health:', error);
    throw new Error('Failed to assess plant health. Please try again.');
  }
}

/**
 * Generate pixel art image using Gemini image generator
 * @param {string} imageUri - URI of the plant image to use as reference
 * @returns {Promise<string>} - Local file URI of the generated image
 */
export async function generatePixelArtImage(imageUri) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const base64Image = await uriToBase64(imageUri);

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };

    // Prompt for pixel art generation
    const prompt = `Create a pixel art style image of this plant in a pot, using the image as reference.
                    Use vibrant colors and a simple, charming 16-bit aesthetic.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;

    // Extract image data from response
    // Note: The actual response format may vary depending on the API
    const imageData = {};
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageData.data = part.inlineData.data;
        break;
      }
    }

    if (!imageData || !imageData.data) {
      throw new Error('No image data received from API');
    }

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `plant_${timestamp}.png`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Save the base64 image to file system
    await FileSystem.writeAsStringAsync(
      fileUri,
      imageData.data,
      { encoding: FileSystem.EncodingType.Base64 }
    );

    return fileUri;
  } catch (error) {
    console.error('Error generating pixel art:', error);
    throw new Error('Failed to generate pixel art image. Please try again.');
  }
}