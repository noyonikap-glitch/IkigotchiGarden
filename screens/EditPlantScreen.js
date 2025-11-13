// screens/editPlantScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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



  if (!plant) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#34a853" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{plant.name}</Text>

      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
      <Image
        key={customImageUri || plant.id}
        source={customImageUri ? { uri: customImageUri } : getPlantImage(plant.type)}
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

<TouchableOpacity
  style={[styles.pixelArtButton, loading && styles.disabledButton]}
  onPress={handleGeneratePixelArt}
  disabled={loading}
>
  <Text style={styles.buttonText}>Generate Pixel Art 🎨</Text>
</TouchableOpacity>

<View style={styles.aiButtonsContainer}>
  <TouchableOpacity
    style={[styles.aiButton, loading && styles.disabledButton]}
    onPress={handleCheckSpecies}
    disabled={loading}
  >
    <Text style={styles.buttonText}>Check species (AI)</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.aiButton, loading && styles.disabledButton]}
    onPress={handleCheckHealth}
    disabled={loading}
  >
    <Text style={styles.buttonText}>Check plant health (AI)</Text>
  </TouchableOpacity>
</View>

{loading && (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4285f4" />
    <Text style={styles.loadingText}>Analyzing image...</Text>
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
    justifyContent: 'center',
  },

  plantImage: {
    width: 120,
    height: 120,
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
  
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#228B22',
  },
  
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#34a853',
    padding: 15,
    borderRadius: 50, // makes it round
    alignItems: 'center',
    marginTop: 10,
  },
  
  deleteButton: {
    backgroundColor: '#d9534f',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 20,
  },

  pixelArtButton: {
    backgroundColor: '#9c27b0',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 20,
  },

  aiButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },

  aiButton: {
    flex: 1,
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },

  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4285f4',
    fontWeight: '600',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },  

  logHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  
  logEntry: {
    fontSize: 14,
    color: '#555',
  },

  plantImage: {
  width: 150,
  height: 150,
  alignSelf: 'center',
  borderRadius: 16,
  marginBottom: 20,
  resizeMode: 'contain',
}
  
});
