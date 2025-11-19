import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { getWateringInterval } from '../utils/getWateringInterval';
import { saveCustomPlants, loadCustomPlants } from '../utils/storage';

export default function AddPlantScreen({ navigation, route, plants, setPlants, customPlants, setCustomPlants }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    (async () => {
      const loaded = await loadCustomPlants();
      setCustomPlants(loaded);
    })();
  }, []);

  // Pre-fill the type field if species was identified
  useEffect(() => {
    if (route.params?.identifiedSpecies) {
      // Extract just the common name (first line before scientific name)
      const species = route.params.identifiedSpecies;
      const commonName = species.split('\n')[0].trim();
      setType(commonName);
    }
  }, [route.params]);

  const handleAddPlant = () => {
    const interval = getWateringInterval(type, customPlants);

    let updatedCustoms = [...customPlants];
    if (!customPlants.some(p => p.name.toLowerCase() === type.toLowerCase())) {
      updatedCustoms.push({ name: type, wateringInterval: 7 });
      setCustomPlants(updatedCustoms);
      saveCustomPlants(updatedCustoms);
    }

    const newPlant = {
      id: (plants.length + 1).toString(),
      name,
      type,
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
      <Text style={styles.header}>Add a New Plant</Text>

      <TextInput
        style={styles.input}
        placeholder="Plant Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Plant Type"
        value={type}
        onChangeText={setType}
      />

      <Button title="Add Plant" onPress={handleAddPlant} color="#34a853" />
    </View>
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
});
