// screens/editPlantScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import getPlantImage from '../utils/getPlantImage';
import { Image } from 'react-native';
import { Animated } from 'react-native';
import { useRef, useCallback } from 'react';
import { checkPlantSpecies, checkPlantHealth, generatePixelArtImage } from '../utils/geminiService';
import { loadPlants, savePlants } from '../utils/storage';

export default function EditPlantScreen({ route, navigation }) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const { plantId } = route.params;

  const [plant, setPlant] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [customImageUri, setCustomImageUri] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  // Load plant data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadPlantData();
    }, [plantId])
  );

  const loadPlantData = async () => {
    // console.log('[EditPlant] Loading plant data for ID:', plantId);
    const plants = await loadPlants();
    // console.log('[EditPlant] Loaded plants from storage:', plants.length);
    const currentPlant = plants.find(p => p.id === plantId);
    if (currentPlant) {
      // console.log('[EditPlant] Found plant:', currentPlant.name);
      // console.log('[EditPlant] Custom image URI:', currentPlant.customImage);
      setPlant(currentPlant);
      setName(currentPlant.name);
      setCustomImageUri(currentPlant.customImage || null);
    } else {
      // console.log('[EditPlant] Plant not found with ID:', plantId);
    }
  };

  const handleRename = async () => {
    const plants = await loadPlants();
    const updated = plants.map(p =>
      p.id === plant.id ? { ...p, name } : p
    );
    await savePlants(updated);
    setIsEditingName(false);
    await loadPlantData();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete "${plant.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const plants = await loadPlants();
            const updated = plants.filter(p => p.id !== plant.id);
            await savePlants(updated);
            navigation.goBack();
          }
        }
      ]
    );
  };


  const handleMarkWatered = async () => {
    const now = new Date();
    const intervalDays = plant.wateringInterval || 7;

    // 1. Cancel previous notification (if exists)
    if (plant.notifId) {
      await Notifications.cancelScheduledNotificationAsync(plant.notifId);
    }

    // 2. Schedule new one
    const nextWateringDate = new Date(now);
    nextWateringDate.setDate(now.getDate() + intervalDays);

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Water ${plant.name} 🌿`,
        body: `${plant.type} is due for watering today.`,
      },
      trigger: nextWateringDate,
    });

    // 3. Update plant log + notifId
    const plants = await loadPlants();
    const updated = plants.map(p => {
      if (p.id === plant.id) {
        const log = p.wateringLog ? [...p.wateringLog, now.toISOString()] : [now.toISOString()];
        return { ...p, wateringLog: log, notifId };
      }
      return p;
    });

    await savePlants(updated);
    await loadPlantData(); // Reload to show updated data

    //4. Animation sequence
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -40,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        friction: 5,
        tension: 20,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleCheckSpecies = async () => {
    try {
      // Request camera roll permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const imageUri = result.assets[0].uri;

        const species = await checkPlantSpecies(imageUri);

        setLoading(false);

        // Ask user if they want to update the plant type
        Alert.alert(
          'Species Identified',
          species,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Update Plant Type',
              onPress: async () => {
                const plants = await loadPlants();
                const updated = plants.map(p =>
                  p.id === plant.id ? { ...p, type: species.split('\n')[0].trim() } : p
                );
                await savePlants(updated);
                await loadPlantData();
                Alert.alert('Success', 'Plant type updated!');
              }
            }
          ]
        );
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to check species');
    }
  };

  const handleCheckHealth = async () => {
    try {
      // Request camera roll permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const imageUri = result.assets[0].uri;

        const healthReport = await checkPlantHealth(imageUri);

        setLoading(false);

        // Display health report
        Alert.alert('Plant Health Report', healthReport, [{ text: 'OK' }]);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to check plant health');
    }
  };

  const handleGeneratePixelArt = async () => {
    try {
      // Request camera roll permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const sourceImageUri = result.assets[0].uri;
        // console.log('[EditPlant] Starting pixel art generation with image:', sourceImageUri);

        // Generate pixel art using the selected image
        const generatedImageUri = await generatePixelArtImage(sourceImageUri);
        // console.log('[EditPlant] Generated image URI:', generatedImageUri);

        // Update plant with custom image
        const plants = await loadPlants();
        // console.log('[EditPlant] Loaded plants before update:', plants.length);
        const updated = plants.map(p =>
          p.id === plant.id ? { ...p, customImage: generatedImageUri } : p
        );
        // console.log('[EditPlant] Saving updated plants to storage');
        await savePlants(updated);
        // console.log('[EditPlant] Plants saved successfully');

        // Verify save
        const verifyPlants = await loadPlants();
        const verifyPlant = verifyPlants.find(p => p.id === plant.id);
        // console.log('[EditPlant] Verification - Plant custom image:', verifyPlant?.customImage);

        setCustomImageUri(generatedImageUri);

        setLoading(false);
        Alert.alert('Success', 'Pixel art image generated successfully!');
      }
    } catch (error) {
      setLoading(false);
      // console.error('[EditPlant] Error generating pixel art:', error);
      Alert.alert('Error', error.message || 'Failed to generate pixel art image');
    }
  };

  const handleRetakeImage = async () => {
    setShowActionModal(false);
    try {
      // Request camera roll permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const imageUri = result.assets[0].uri;

        const species = await checkPlantSpecies(imageUri);

        setLoading(false);

        // Extract scientific name from the response (assuming it's in parentheses)
        const newScientificName = species.match(/\(([^)]+)\)/)?.[1] || '';
        const currentScientificName = plant.type.match(/\(([^)]+)\)/)?.[1] || plant.type;

        // Check if it's a different species
        if (newScientificName && currentScientificName && 
            newScientificName.toLowerCase() !== currentScientificName.toLowerCase()) {
          Alert.alert(
            'Different Plant Detected',
            'Please create a new plant entry for a different plant species.',
            [{ text: 'OK' }]
          );
        }
        // If same species, do nothing for now as requested
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to check species');
    }
  };

  const handleMarkWateredFromModal = async () => {
    setShowActionModal(false);
    await handleMarkWatered();
  };

  const handleGeneratePixelArtFromModal = async () => {
    setShowActionModal(false);
    await handleGeneratePixelArt();
  };



  if (!plant) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#34a853" />
      </View>
    );
  }

  const lastWatered = plant.wateringLog && plant.wateringLog.length > 0
    ? new Date(plant.wateringLog[plant.wateringLog.length - 1]).toLocaleDateString()
    : 'Never';

  return (
    <View style={styles.container}>
      {/* Header with Save Button */}
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.saveButtonTop} onPress={handleRename}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Plant Image */}
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Image
          key={customImageUri || plant.id}
          source={customImageUri ? { uri: customImageUri } : getPlantImage(plant.type)}
          style={styles.plantImage}
        />
      </Animated.View>

      {/* Editable Plant Name */}
      {isEditingName ? (
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          onBlur={() => setIsEditingName(false)}
          autoFocus
        />
      ) : (
        <TouchableOpacity onPress={() => setIsEditingName(true)}>
          <Text style={styles.plantName}>{name}</Text>
        </TouchableOpacity>
      )}

      {/* Info Rows */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Species</Text>
          <Text style={styles.infoValue}>{plant.type}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Watered</Text>
          <Text style={styles.infoValue}>{lastWatered}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Water Cycle</Text>
          <Text style={styles.infoValue}>Every {plant.wateringInterval || 7} days</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Health</Text>
          <Text style={styles.infoValue}>Good</Text>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.deleteButtonBottom} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButtonCircle} onPress={() => setShowActionModal(true)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleRetakeImage}
            >
              <Text style={styles.modalButtonText}>Retake Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleMarkWateredFromModal}
            >
              <Text style={styles.modalButtonText}>Mark as Watered</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleGeneratePixelArtFromModal}
            >
              <Text style={styles.modalButtonText}>Regenerate Pixel Art</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4285f4" />
          <Text style={styles.loadingText}>Analyzing image...</Text>
          <Text style={styles.subLoadingText}>Be right back...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 20,
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },

  saveButtonTop: {
    backgroundColor: '#34a853',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  plantImage: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    borderRadius: 16,
    marginBottom: 20,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },

  plantName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#228B22',
    marginBottom: 30,
  },

  nameInput: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#228B22',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#228B22',
    paddingBottom: 5,
  },

  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 16,
    color: '#228B22',
    fontWeight: 'bold',
    textAlign: 'right',
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  deleteButtonBottom: {
    flex: 1,
    backgroundColor: '#d9534f',
    paddingVertical: 15,
    borderRadius: 25,
    marginRight: 10,
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  addButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34a853',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 30,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },

  modalButton: {
    backgroundColor: '#34a853',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },

  cancelButton: {
    backgroundColor: '#666',
  },

  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },

  subLoadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
});

