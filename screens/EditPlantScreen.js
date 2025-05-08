// screens/editPlantScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import getPlantImage from '../utils/getPlantImage';
import { Image } from 'react-native';
import { Animated } from 'react-native';
import { useRef } from 'react';





export default function EditPlantScreen({ route, navigation }) {
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const { plant, plants, setPlants } = route.params;
  const [name, setName] = useState(plant.name);

  const handleRename = () => {
    const updated = plants.map(p => 
      p.id === plant.id ? { ...p, name } : p
    );
    setPlants(updated);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete "${plant.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
            const updated = plants.filter(p => p.id !== plant.id);
            setPlants(updated);
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
    const updated = plants.map(p => {
      if (p.id === plant.id) {
        const log = p.wateringLog ? [...p.wateringLog, now.toISOString()] : [now.toISOString()];
        return { ...p, wateringLog: log, notifId };
      }
      return p;
    });

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
    
  
    setPlants(updated);
    //navigation.goBack();
  };
  
  
  
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{plant.name}</Text>
      
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
      <Image source={getPlantImage(plant.type)} style={styles.plantImage} />
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
