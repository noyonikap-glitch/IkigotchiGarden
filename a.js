import { StatusBar } from 'expo-status-bar';// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, FlatList, TextInput, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import getPlantImage from './utils/getPlantImage';
import { loadPlants, savePlants } from './utils/storage';
import EditPlantScreen from './screens/EditPlantScreen';
import { getWateringInterval } from './utils/getWateringInterval';
import { saveCustomPlants, loadCustomPlants } from './utils/storage';
import * as Notifications from 'expo-notifications';
import { Dimensions } from 'react-native';
//import * as Permissions from 'expo-permissions';
//import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();
const screenWidth = Dimensions.get('window').width;

export default function App() {
  
  const [plants, setPlants] = useState([
    /*{ id: '1', name: 'Henry', type: 'Snake Plant', wateringInterval: 7 },
    { id: '2', name: 'Tyler', type: 'Fiddle Leaf Fig', wateringInterval: 5 },*/
  ]);

  

  // Load on startup
  useEffect(() => {
    (async () => {
      const storedPlants = await loadPlants();
      setPlants(storedPlants);
    })();
  }, []);

  // Ask for notification permission
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Enable notifications to get watering reminders!');
      }
    })();
  }, []);
  

  // Save whenever plants change
  useEffect(() => {
    savePlants(plants);
  }, [plants]);

  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" options={{ title: '' }}>
          {(props) => <HomeScreen {...props} plants={plants} setPlants={setPlants} />}
        </Stack.Screen>
        <Stack.Screen name="AddPlant">
          {(props) => <AddPlantScreen {...props} plants={plants} setPlants={setPlants} />}
        </Stack.Screen>
        <Stack.Screen name="EditPlant" >
          {(props) => (
            <EditPlantScreen {...props} plants={plants} setPlants={setPlants} />
          )}
      </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen({ navigation, plants, setPlants }) {
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
                Water: Every {item.wateringInterval} {item.wateringInterval === 1 ? 'day' : 'days'}
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

function AddPlantScreen({ navigation, plants, setPlants }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [customPlants, setCustomPlants] = useState([]);

  useEffect(() => {
    (async () => {
      const loaded = await loadCustomPlants();
      setCustomPlants(loaded);
    })();
}, []);

  //const [needsWater, setNeedsWater] = useState('');

  /*
  const getWateringNeeds = (type) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('snake')) return 'Every 7 days';
    if (lowerType.includes('fiddle')) return 'Every 5 days';
    if (lowerType.includes('monstera')) return 'Every 4 days';
    if (lowerType.includes('pothos')) return 'Every 6 days';
    if (lowerType.includes('peace lily')) return 'Every 3 days';
    return 'Every 7 days'; // default fallback
  };*/

  const handleAddPlant = () => {
    const interval = getWateringInterval(type, customPlants);
    // If custom entry didn't exist, track it manually:
    const alreadyExists = customPlants.find(
    p => p.name.toLowerCase() === type.toLowerCase()
);
if (!alreadyExists) {
  setCustomPlants([...customPlants, { name: type, wateringInterval: 7 }]);
}
    let updatedCustoms = [...customPlants];
  
    if (!customPlants.some(p => p.name.toLowerCase() === type.toLowerCase())) {
      updatedCustoms.push({ name: type, wateringInterval: 7 });
      setCustomPlants(updatedCustoms);
      saveCustomPlants(updatedCustoms); // 🔐 persist to storage
    }
  
    const newPlant = {
      id: (plants.length + 1).toString(),
      name,
      type,
      wateringInterval: interval,
      lastWatered: new Date().toISOString(),
    };
  
    setPlants([...plants, newPlant]);
  
    // ✅ Use a small delay to allow all state updates before going back
    setTimeout(() => {
      navigation.goBack();
    }, 50); // you can reduce to 10–20ms if it works reliably
  };
  


  //};

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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#228B22',
  },
  
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
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
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderColor: '#ccc',
    borderWidth: 1,
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

gridContainer: {
  paddingBottom: 80,
},

columnWrapper: {
  justifyContent: 'space-between',
  marginBottom: 16,
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
}

});
