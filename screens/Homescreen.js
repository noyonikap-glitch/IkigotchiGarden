// screens/HomeScreen.js

import React, { useEffect } from 'react';
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

      <AddPlantButton />
    </View>
  );
}

function AddPlantButton() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={() => navigation.navigate('AddPlant')}
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
  addButtonText: {
    color: '#fff',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
});