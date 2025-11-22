// screens/HomeScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Image } from 'react-native';
import getPlantImage from '../utils/getPlantImage';
import { loadPlants } from '../utils/storage';
import { scale, verticalScale, moderateScale, screenWidth } from '../utils/layout';

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
                source={item.customImage ? { uri: item.customImage } : getPlantImage(item.species || item.genus || item.type)}
                style={styles.plantImage}
              />
              <Text style={styles.plantType}>
                {item.species || item.genus || ' '}
              </Text>
              <Text style={styles.plantWater}>
                Water: Every {item.wateringInterval}{' '}
                {item.wateringInterval === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <AddPlantButton loading={loading} setLoading={setLoading} />

      {loading && <LoadingOverlay />}
    </View>
  );
}

function AddPlantButton({ loading, setLoading }) {
  const navigation = useNavigation();

  const handleAddPlant = async () => {
    try {
      const imageUri = await pickImageFromGallery();
      
      if (!imageUri) return;

      setLoading(true);

      // Call both Gemini and AI backend in parallel
      const [geminiSpecies, aiResult] = await Promise.all([
        checkPlantSpecies(imageUri),
        classifyPlantWithAI(imageUri)
      ]);

      // Extract genus from Gemini result
      const geminiGenus = extractGenus(geminiSpecies);
      const aiGenus = aiResult?.top_prediction?.genus?.toLowerCase();

      console.log('[HandleAddPlant] Gemini species:', geminiSpecies);
      console.log('[HandleAddPlant] Gemini genus:', geminiGenus);
      console.log('[HandleAddPlant] AI genus:', aiGenus);
      console.log('[HandleAddPlant] AI confidence:', aiResult?.top_prediction?.confidence);

      // Decide which result to use
      let finalSpecies;
      if (geminiGenus && aiGenus && geminiGenus === aiGenus) {
        // Genus matches - use Gemini's more detailed output
        finalSpecies = geminiSpecies;
        console.log('[HandleAddPlant] Genus match! Using Gemini result');
      } else {
        // Genus doesn't match - use AI model output
        const aiPrediction = aiResult?.top_prediction;
        finalSpecies = aiPrediction?.genus || geminiSpecies;
        console.log('[HandleAddPlant] Genus mismatch or no match. Using AI result:', finalSpecies);
      }

      setLoading(false);

      // Navigate to AddPlant screen with the species information
      navigation.navigate('AddPlant', { identifiedSpecies: finalSpecies });
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
    paddingTop: verticalScale(50),
    paddingHorizontal: scale(20),
  },
  header: {
    fontSize: moderateScale(32),
    fontWeight: 'bold',
    marginBottom: verticalScale(20),
    textAlign: 'center',
    color: '#228B22',
  },
  gridContainer: {
    paddingBottom: verticalScale(80),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  plantCard: {
    backgroundColor: '#d4edda',
    borderRadius: scale(12),
    padding: scale(12),
    width: screenWidth * 0.43,
    alignItems: 'center',
  },
  plantName: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
    textAlign: 'center',
  },
  plantType: {
    fontSize: moderateScale(14),
    color: '#444',
    textAlign: 'center',
  },
  plantWater: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
    color: '#228B22',
    textAlign: 'center',
  },
  plantImage: {
    width: scale(70),
    height: scale(70),
    resizeMode: 'contain',
    marginVertical: verticalScale(8),
  },
  addButton: {
    backgroundColor: '#34a853',
    padding: scale(15),
    borderRadius: scale(50),
    alignItems: 'center',
    position: 'absolute',
    bottom: verticalScale(40),
    right: scale(20),
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  addButtonText: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
});
