import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { getWateringInterval } from '../utils/getWateringInterval';
import { saveCustomPlants, loadCustomPlants } from '../utils/storage';
import { scale, verticalScale, moderateScale } from '../utils/layout';
import { scheduleNotificationForPlant } from '../utils/notificationScheduler';

export default function AddPlantScreen({ navigation, plants, setPlants, customPlants, setCustomPlants }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [genus, setGenus] = useState('');
  const [wateringIntervalInput, setWateringIntervalInput] = useState('');

  useEffect(() => {
    (async () => {
      const loaded = await loadCustomPlants();
      setCustomPlants(loaded);
    })();
  }, []);

  const handleAddPlant = async () => {
    if (!name.trim()) {
      alert('Please enter a plant name');
      return;
    }

    // Parse watering interval input
    // Special test value: "test" = 1 minute for testing notifications
    let interval;
    if (wateringIntervalInput.toLowerCase() === 'test') {
      interval = 1 / (24 * 60); // 1 minute in days
    } else {
      const parsedInterval = parseInt(wateringIntervalInput);
      const customInterval = parsedInterval > 0 ? parsedInterval : null;
      // Use custom interval if provided, otherwise use default logic
      interval = customInterval || getWateringInterval(species, customPlants);
    }

    let updatedCustoms = [...customPlants];
    if (species && !customPlants.some(p => p.name.toLowerCase() === species.toLowerCase())) {
      updatedCustoms.push({ name: species, wateringInterval: 7 });
      setCustomPlants(updatedCustoms);
      saveCustomPlants(updatedCustoms);
    }

    // Generate unique ID by finding max existing ID and incrementing
    const maxId = plants.length === 0
      ? 0
      : Math.max(...plants.map(p => parseInt(p.id) || 0));
    const newId = (maxId + 1).toString();

    const newPlant = {
      id: newId,
      name,
      species: species || null,
      genus: genus || null,
      type: species || genus || '',
      wateringInterval: interval,
      lastWatered: new Date().toISOString(),
    };

    // Schedule notification for new plant
    const notifId = await scheduleNotificationForPlant(newPlant);
    newPlant.notifId = notifId;

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
        placeholder="Watering Interval (Days) - Optional"
        value={wateringIntervalInput}
        onChangeText={setWateringIntervalInput}
        keyboardType="numeric"
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
    marginTop: moderateScale(-10),
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