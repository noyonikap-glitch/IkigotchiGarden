// utils/plantStorage.js
import { loadPlants, savePlants } from './storage';

/**
 * Update a plant with new data
 * @param {string} plantId - The ID of the plant to update
 * @param {object} updates - Object containing fields to update
 * @returns {Promise<object>} - The updated plant object
 */
export async function updatePlant(plantId, updates) {
  const plants = await loadPlants();
  const updated = plants.map(p => 
    p.id === plantId ? { ...p, ...updates } : p
  );
  await savePlants(updated);
  return updated.find(p => p.id === plantId);
}

/**
 * Delete a plant by ID
 * @param {string} plantId - The ID of the plant to delete
 * @returns {Promise<void>}
 */
export async function deletePlant(plantId) {
  const plants = await loadPlants();
  const updated = plants.filter(p => p.id !== plantId);
  await savePlants(updated);
}
