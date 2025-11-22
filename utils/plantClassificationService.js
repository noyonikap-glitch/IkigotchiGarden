/**
 * Plant Classification Service
 * Communicates with the AI backend for plant species identification
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Classify plant using the AI backend model
 * @param {string} imageUri - URI of the plant image
 * @returns {Promise<Object>} - Classification result with genus and confidence
 */
export async function classifyPlantWithAI(imageUri) {
  try {
    // Fetch the image as a blob first
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create FormData for multipart upload
    const formData = new FormData();
    
    // In React Native, we need to provide the file with proper metadata
    formData.append('file', blob, 'plant_image.jpg');

    // Call backend API using axios
    const apiResponse = await axios.post(
      `${API_BASE_URL}/api/classify/plant`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      }
    );

    console.log('[PlantClassification] AI Backend result:', apiResponse.data);

    return apiResponse.data;
  } catch (error) {
    console.error('[PlantClassification] Error calling AI backend:', error.response?.data || error.message);
    throw new Error('Failed to classify plant with AI model. Please try again.');
  }
}

/**
 * Extract genus from a plant name string
 * @param {string} plantName - Plant name (common or scientific)
 * @returns {string} - Extracted genus (first word after capitalization)
 */
export function extractGenus(plantName) {
  if (!plantName) return null;
  
  // Match pattern like "Common Name (Genus species)"
  const scientificMatch = plantName.match(/\(([A-Z][a-z]+)/);
  if (scientificMatch) {
    return scientificMatch[1].toLowerCase();
  }
  
  // If no parentheses, try to extract first capitalized word
  const words = plantName.split(' ');
  for (const word of words) {
    if (word[0] === word[0].toUpperCase() && word.length > 2) {
      return word.toLowerCase();
    }
  }
  
  return null;
}
