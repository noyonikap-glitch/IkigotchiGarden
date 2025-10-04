import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import MainNavigator from './screens/MainNavigator';
import { loadPlants, savePlants, loadCustomPlants, saveCustomPlants } from './utils/storage';
import { configureNotificationHandler } from './utils/notifications';

configureNotificationHandler();

export default function App() {
  const [plants, setPlants] = useState([]);
  const [customPlants, setCustomPlants] = useState([]);

  // Load stored plants and custom plants on startup
  useEffect(() => {
    (async () => {
      // console.log('[App] Loading initial plants from storage');
      const storedPlants = await loadPlants();
      const storedCustoms = await loadCustomPlants();
      // console.log('[App] Loaded plants:', storedPlants.length);
    //   storedPlants.forEach((plant, index) => {
    //     console.log(`[App] Plant ${index + 1}:`, plant.name, 'Custom Image:', plant.customImage);
    //   });
      setPlants(storedPlants);
      setCustomPlants(storedCustoms);
    })();
  }, []);

  // Save plant list on change
  useEffect(() => {
    // console.log('[App] Plants state changed, saving:', plants.length);
    savePlants(plants);
  }, [plants]);

  // Save custom plant list on change
  useEffect(() => {
    saveCustomPlants(customPlants);
  }, [customPlants]);

  // Ask for notification permission
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Enable notifications to get watering reminders!');
      }
    })();
  }, []);

  return (
    <NavigationContainer>
      <MainNavigator
        plants={plants}
        setPlants={setPlants}
        customPlants={customPlants}
        setCustomPlants={setCustomPlants}
      />
    </NavigationContainer>
  );
}
