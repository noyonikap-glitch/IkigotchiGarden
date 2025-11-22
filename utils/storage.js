import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'PLANT_LIST';

export async function savePlants(plants) {
  try {
    // console.log('[Storage] Saving plants:', plants.length);
    const json = JSON.stringify(plants);
    await AsyncStorage.setItem(STORAGE_KEY, json);
    // console.log('[Storage] Plants saved successfully');
  } catch (e) {
    console.error('[Storage] Failed to save plants:', e);
  }
}

export async function loadPlants() {
  try {
    // console.log('[Storage] Loading plants from AsyncStorage');
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    let plants = json != null ? JSON.parse(json) : [];

    // Migrate old plant data to new schema
    let needsMigration = false;
    plants = plants.map(plant => {
      if (!plant.hasOwnProperty('species') || !plant.hasOwnProperty('genus')) {
        needsMigration = true;
        return {
          ...plant,
          species: plant.type || null,
          genus: null,
        };
      }
      return plant;
    });

    // Save migrated data back to storage
    if (needsMigration) {
      console.log('[Storage] Migrating plant data to new schema');
      await savePlants(plants);
    }

    // console.log('[Storage] Loaded plants:', plants.length);
    return plants;
  } catch (e) {
    console.error('[Storage] Failed to load plants:', e);
    return [];
  }
}

const CUSTOM_KEY = 'CUSTOM_PLANTS';

export async function saveCustomPlants(customPlants) {
  try {
    const json = JSON.stringify(customPlants);
    await AsyncStorage.setItem(CUSTOM_KEY, json);
  } catch (e) {
    console.error('Failed to save custom plants:', e);
  }
}

export async function loadCustomPlants() {
  try {
    const json = await AsyncStorage.getItem(CUSTOM_KEY);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to load custom plants:', e);
    return [];
  }
}

