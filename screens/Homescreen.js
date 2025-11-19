// screens/HomeScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import getPlantImage from '../utils/getPlantImage';
import { loadPlants } from '../utils/storage';
import { checkPlantSpecies } from '../utils/geminiService';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen({ navigation, plants, setPlants }) {
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // console.log('[HomeScreen] Screen focused, reloading plants from storage');
      (async () => {
        const freshPlants = await loadPlants();
        // console.log('[HomeScreen] Loaded fresh plants:', freshPlants.length);
        freshPlants.forEach((plant, index) => {
          // console.log(`[HomeScreen] Plant ${index + 1}:`, plant.name, 'Custom Image:', plant.customImage);
        });
        setPlants(freshPlants);
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ikigotchi</Text>

      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('EditPlant', {
                plantId: item.id,
              })
            }
          >
            <View style={styles.plantCard}>
              <Text style={styles.plantName}>{item.name}</Text>
              <Image
                key={item.customImage || item.id}
                source={item.customImage ? { uri: item.customImage } : getPlantImage(item.type)}
                style={styles.plantImage}
              />
              <Text style={styles.plantType}>{item.type}</Text>
              <Text style={styles.plantWater}>
                Water: Every {item.wateringInterval}{' '}
                {item.wateringInterval === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <AddPlantButton loading={loading} setLoading={setLoading} />

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

function AddPlantButton({ loading, setLoading }) {
  const navigation = useNavigation();

  const handleAddPlant = async () => {
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

        // Call Gemini to identify the plant species
        const species = await checkPlantSpecies(imageUri);

        setLoading(false);

        // Navigate to AddPlant screen with the species information
        navigation.navigate('AddPlant', { identifiedSpecies: species });
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to identify plant');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.addButton, loading && styles.disabledButton]}
      onPress={handleAddPlant}
      disabled={loading}
    >
      <Text style={styles.addButtonText}>+ Add Plant</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#228B22',
  },
  gridContainer: {
    paddingBottom: 80,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  plantCard: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 12,
    width: screenWidth * 0.43,
    alignItems: 'center',
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  plantType: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  plantWater: {
    fontSize: 13,
    marginTop: 4,
    color: '#228B22',
    textAlign: 'center',
  },
  plantImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginVertical: 8,
  },
  addButton: {
    backgroundColor: '#34a853',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
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
