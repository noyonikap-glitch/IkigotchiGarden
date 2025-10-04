import { GoogleGenerativeAI } from '@google/generative-ai';

// You'll need to set your Gemini API key here or in an environment variable
const API_KEY = 'AIzaSyClvyttAktAyjpsQOje3Ev7Pt7eBoKxBZw';

const genAI = new GoogleGenerativeAI(API_KEY);

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

    const prompt = "What species is this plant? Please provide only the common name and scientific name if possible, being as specific as you can.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

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

    const prompt = "Is this plant healthy? Please analyze the plant's condition and provide: 1) Overall health status, 2) Any visible issues or diseases, 3) Recommendations for care if needed.";

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error checking plant health:', error);
    throw new Error('Failed to assess plant health. Please try again.');
  }
}