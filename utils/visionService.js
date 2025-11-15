// Test vision service for genus detection
// This is a mock implementation that will be replaced with actual model inference

/**
 * Test function that randomly returns a genus or null
 * @param {string} imageUri - URI of the image to analyze
 * @returns {Promise<string|null>} - Returns "Quercus" or null randomly
 */
export async function detectPlantGenus(imageUri) {
  // Simulate network/processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Randomly return "Quercus" or null (50/50 chance)
  const random = Math.random();

  if (random > 0.5) {
    return "Quercus";
  } else {
    return null;
  }
}
