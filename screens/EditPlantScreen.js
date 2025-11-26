// screens/editPlantScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import getPlantImage from '../utils/getPlantImage';
import { Image } from 'react-native';
import { Animated } from 'react-native';
import { useRef, useCallback } from 'react';
import { checkPlantSpecies, checkPlantHealth, generatePixelArtImage } from '../utils/geminiService';
import { loadPlants, savePlants } from '../utils/storage';
import { detectPlantGenus } from '../utils/visionService';
import { scale, verticalScale, moderateScale } from '../utils/layout';

export default function EditPlantScreen({ route, navigation }) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const { plantId } = route.params;

  const [plant, setPlant] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [customImageUri, setCustomImageUri] = useState(null);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [detectedGenus, setDetectedGenus] = useState(null);
  const [showSpeciesMismatchModal, setShowSpeciesMismatchModal] = useState(false);
  const [detectedSpecies, setDetectedSpecies] = useState(null);

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
    navigation.goBack();
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
        body: `${plant.species || plant.genus || 'Your plant'} is due for watering today.`,
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

        const speciesResponse = await checkPlantSpecies(imageUri);
        const species = speciesResponse.split('\n')[0].trim();

        setLoading(false);

        // Check for species/genus mismatch
        if (plant.genus && !species.toLowerCase().includes(plant.genus.toLowerCase())) {
          // Mismatch detected - show modal
          setDetectedSpecies(species);
          setShowSpeciesMismatchModal(true);
        } else {
          // No mismatch or genus matches - update species directly
          const plants = await loadPlants();
          const updated = plants.map(p =>
            p.id === plant.id ? { ...p, species } : p
          );
          await savePlants(updated);
          await loadPlantData();
          Alert.alert('Success', `Species updated to "${species}"`);
        }
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
        aspect: [1, 1],
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

  const handleDetectGenus = async () => {
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const imageUri = result.assets[0].uri;

        const genus = await detectPlantGenus(imageUri);

        setLoading(false);

        // Handle null detection
        if (genus === null) {
          Alert.alert(
            'Detection Failed',
            'The model could not identify a genus for this plant.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Check for genus/species mismatch
        if (plant.species && plant.species.toLowerCase().includes(genus.toLowerCase())) {
          // Species contains genus - they match, update genus directly
          const plants = await loadPlants();
          const updated = plants.map(p =>
            p.id === plant.id ? { ...p, genus } : p
          );
          await savePlants(updated);
          await loadPlantData();
          Alert.alert('Success', `Genus updated to "${genus}"`);
        } else if (plant.species && !plant.species.toLowerCase().includes(genus.toLowerCase())) {
          // Mismatch detected - show modal
          setDetectedGenus(genus);
          setShowMismatchModal(true);
        } else {
          // No species present, just update genus
          const plants = await loadPlants();
          const updated = plants.map(p =>
            p.id === plant.id ? { ...p, genus } : p
          );
          await savePlants(updated);
          await loadPlantData();
          Alert.alert('Success', `Genus set to "${genus}"`);
        }
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to detect genus');
    }
  };

  const handleMismatchChoice = async (choice) => {
    const plants = await loadPlants();
    let updated;

    switch (choice) {
      case 'keep_both':
        // Keep both genus and species
        updated = plants.map(p =>
          p.id === plant.id ? { ...p, genus: detectedGenus } : p
        );
        break;
      case 'remove_species':
        // Remove species, keep genus
        updated = plants.map(p =>
          p.id === plant.id ? { ...p, species: null, genus: detectedGenus } : p
        );
        break;
      case 'remove_genus':
        // Keep species, don't update genus
        updated = plants;
        break;
    }

    await savePlants(updated);
    await loadPlantData();
    setShowMismatchModal(false);
    setDetectedGenus(null);
  };

  const handleSpeciesMismatchChoice = async (choice) => {
    const plants = await loadPlants();
    let updated;

    switch (choice) {
      case 'keep_both':
        // Keep both genus and species
        updated = plants.map(p =>
          p.id === plant.id ? { ...p, species: detectedSpecies } : p
        );
        break;
      case 'remove_genus':
        // Remove genus, keep species
        updated = plants.map(p =>
          p.id === plant.id ? { ...p, genus: null, species: detectedSpecies } : p
        );
        break;
      case 'remove_species':
        // Keep genus, don't update species
        updated = plants;
        break;
    }

    await savePlants(updated);
    await loadPlantData();
    setShowSpeciesMismatchModal(false);
    setDetectedSpecies(null);
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
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>{plant.name}</Text>

        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <Image
          key={customImageUri || plant.id}
          source={customImageUri ? { uri: customImageUri } : getPlantImage(plant.species || plant.genus || plant.type)}
          style={styles.plantImage}
        />
        </Animated.View>


        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Plant Name"
        />

{plant.wateringLog && plant.wateringLog.length > 0 && (
  <View style={{ marginVertical: 20 }}>
    <Text style={styles.logHeader}>Watering History:</Text>
    {plant.wateringLog.slice(-3).reverse().map((entry, index) => (
      <Text key={index} style={styles.logEntry}>
        {new Date(entry).toLocaleDateString()} at {new Date(entry).toLocaleTimeString()}
      </Text>
    ))}
  </View>
)}

<TouchableOpacity style={styles.saveButton} onPress={handleMarkWatered}>
  <Text style={styles.buttonText}>Mark as Watered</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.saveButton} onPress={handleRename}>
  <Text style={styles.buttonText}>Save Changes</Text>
</TouchableOpacity>


<TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
  <Text style={styles.buttonText}>Delete Plant</Text>
</TouchableOpacity>

<View style={styles.topAiButtonsContainer}>
  <TouchableOpacity
    style={[styles.detectGenusButton, loading && styles.disabledButton]}
    onPress={handleDetectGenus}
    disabled={loading}
  >
    <Text style={styles.buttonText}>Detect Genus</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.smallAiButton, loading && styles.disabledButton]}
    onPress={handleGeneratePixelArt}
    disabled={loading}
  >
    <Text style={styles.buttonText}>Pixel Art 🎨</Text>
  </TouchableOpacity>
</View>

<View style={styles.aiButtonsContainer}>
  <TouchableOpacity
    style={[styles.aiButton, loading && styles.disabledButton]}
    onPress={handleCheckSpecies}
    disabled={loading}
  >
    <Text style={styles.buttonText}>Check species (Gemini)</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.aiButton, loading && styles.disabledButton]}
    onPress={handleCheckHealth}
    disabled={loading}
  >
    <Text style={styles.buttonText}>Check plant health (Gemini)</Text>
  </TouchableOpacity>
</View>

{loading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4285f4" />
    <Text style={styles.loadingText}>Analyzing image...</Text>
  </View>
)}

<Modal
  visible={showMismatchModal}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setShowMismatchModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Genus/Species Mismatch</Text>
      <Text style={styles.modalText}>
        The detected genus "{detectedGenus}" doesn't match your current species "{plant?.species}".
        {'\n\n'}
        What would you like to do?
      </Text>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => handleMismatchChoice('keep_both')}
      >
        <Text style={styles.modalButtonText}>Keep Both</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalButton, styles.modalButtonWarning]}
        onPress={() => handleMismatchChoice('remove_species')}
      >
        <Text style={styles.modalButtonText}>Remove Species, Keep Genus</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalButton, styles.modalButtonCancel]}
        onPress={() => handleMismatchChoice('remove_genus')}
      >
        <Text style={styles.modalButtonText}>Cancel (Keep Species)</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
  visible={showSpeciesMismatchModal}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setShowSpeciesMismatchModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Species/Genus Mismatch</Text>
      <Text style={styles.modalText}>
        The detected species "{detectedSpecies}" doesn't match your current genus "{plant?.genus}".
        {'\n\n'}
        What would you like to do?
      </Text>

      <TouchableOpacity
        style={styles.modalButton}
        onPress={() => handleSpeciesMismatchChoice('keep_both')}
      >
        <Text style={styles.modalButtonText}>Keep Both</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalButton, styles.modalButtonWarning]}
        onPress={() => handleSpeciesMismatchChoice('remove_genus')}
      >
        <Text style={styles.modalButtonText}>Remove Genus, Keep Species</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modalButton, styles.modalButtonCancel]}
        onPress={() => handleSpeciesMismatchChoice('remove_species')}
      >
        <Text style={styles.modalButtonText}>Cancel (Keep Genus)</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },

  scrollContent: {
    padding: scale(20),
    paddingBottom: verticalScale(40),
  },

  backButton: {
    position: 'absolute',
    top: verticalScale(50),
    left: scale(20),
    zIndex: 10,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(34, 139, 34, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 139, 34, 0.2)',
  },

  backButtonText: {
    fontSize: moderateScale(28),
    color: '#228B22',
    fontWeight: 'bold',
    marginTop: moderateScale(-10),
  },

  plantImage: {
    width: scale(120),
    height: scale(120),
    alignSelf: 'center',
    borderRadius: scale(16),
    marginBottom: verticalScale(20),
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

  header: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    marginBottom: verticalScale(30),
    textAlign: 'center',
    color: '#228B22',
  },

  input: {
    backgroundColor: '#fff',
    padding: scale(15),
    borderRadius: scale(10),
    marginBottom: verticalScale(20),
    fontSize: moderateScale(16),
    borderColor: '#ccc',
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#34a853',
    padding: scale(15),
    borderRadius: scale(50),
    alignItems: 'center',
    marginTop: verticalScale(10),
  },

  deleteButton: {
    backgroundColor: '#d9534f',
    padding: scale(15),
    borderRadius: scale(50),
    alignItems: 'center',
    marginTop: verticalScale(20),
  },

  pixelArtButton: {
    backgroundColor: '#9c27b0',
    padding: scale(15),
    borderRadius: scale(50),
    alignItems: 'center',
    marginTop: verticalScale(20),
  },

  aiButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(20),
    gap: scale(10),
  },

  aiButton: {
    flex: 1,
    backgroundColor: '#4285f4',
    padding: scale(15),
    borderRadius: scale(50),
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },

  loadingContainer: {
    marginTop: verticalScale(20),
    alignItems: 'center',
  },

  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: '#4285f4',
    fontWeight: '600',
  },

  buttonText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    textAlign: 'center',
  },

  logHeader: {
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginBottom: verticalScale(5),
  },

  logEntry: {
    fontSize: moderateScale(14),
    color: '#555',
  },

  topAiButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(20),
    gap: scale(10),
  },

  smallAiButton: {
    flex: 1,
    backgroundColor: '#9c27b0',
    padding: scale(15),
    borderRadius: scale(50),
    alignItems: 'center',
  },

  detectGenusButton: {
    flex: 1,
    backgroundColor: '#bf0000',
    padding: scale(15),
    borderRadius: scale(50),
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(25),
    width: '85%',
    maxWidth: scale(400),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: '#228B22',
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },

  modalText: {
    fontSize: moderateScale(16),
    color: '#333',
    marginBottom: verticalScale(20),
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },

  modalButton: {
    backgroundColor: '#34a853',
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },

  modalButtonWarning: {
    backgroundColor: '#ff9800',
  },

  modalButtonCancel: {
    backgroundColor: '#757575',
  },

  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});