// utils/imagePicker.js
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Request permission and pick an image from the device gallery
 * @returns {Promise<string|null>} - Image URI or null if canceled/failed
 */
export async function pickImageFromGallery() {
  try {
    // Request camera roll permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return null;
    }

    // Pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
    return null;
  }
}
