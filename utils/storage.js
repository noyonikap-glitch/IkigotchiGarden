import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'PLANT_LIST';

export async function savePlants(plants) {
  try {
    const json = JSON.stringify(plants);
    await AsyncStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('Failed to save plants:', e);
  }
}

export async function loadPlants() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Failed to load plants:', e);
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

