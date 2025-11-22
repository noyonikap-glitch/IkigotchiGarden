import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { getWateringInterval } from '../utils/getWateringInterval';
import { saveCustomPlants, loadCustomPlants } from '../utils/storage';
import { scale, verticalScale, moderateScale } from '../utils/layout';

export default function AddPlantScreen({ navigation, plants, setPlants, customPlants, setCustomPlants }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [genus, setGenus] = useState('');

  useEffect(() => {
    (async () => {
      const loaded = await loadCustomPlants();
      setCustomPlants(loaded);
    })();
  }, []);

  const handleAddPlant = () => {
    if (!name.trim()) {
      alert('Please enter a plant name');
      return;
    }

    const interval = getWateringInterval(species, customPlants);

    let updatedCustoms = [...customPlants];
    if (species && !customPlants.some(p => p.name.toLowerCase() === species.toLowerCase())) {
      updatedCustoms.push({ name: species, wateringInterval: 7 });
      setCustomPlants(updatedCustoms);
      saveCustomPlants(updatedCustoms);
    }

    const newPlant = {
      id: (plants.length + 1).toString(),
      name,
      species: species || null,
      genus: genus || null,
      type: species || genus || '',
      wateringInterval: interval,
      lastWatered: new Date().toISOString(),
    };

    setPlants([...plants, newPlant]);

    setTimeout(() => {
      navigation.goBack();
    }, 50);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Add a New Plant</Text>

      <TextInput
        style={styles.input}
        placeholder="Plant Name (Required)"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Species (Optional)"
        value={species}
        onChangeText={setSpecies}
      />
      <TextInput
        style={styles.input}
        placeholder="Genus (Optional)"
        value={genus}
        onChangeText={setGenus}
      />

      <Button title="Add Plant" onPress={handleAddPlant} color="#34a853" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    paddingTop: verticalScale(50),
    paddingHorizontal: scale(20),
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
    marginTop: verticalScale(-10),
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
});
