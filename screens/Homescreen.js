// screens/HomeScreen.js

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import getPlantImage from '../utils/getPlantImage';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen({ navigation, plants, setPlants }) {
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
                plant: item,
                plants,
                setPlants,
              })
            }
          >
            <View style={styles.plantCard}>
              <Text style={styles.plantName}>{item.name}</Text>
              <Image
                source={getPlantImage(item.type)}
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
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
