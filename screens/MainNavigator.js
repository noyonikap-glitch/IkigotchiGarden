import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './Homescreen';
import AddPlantScreen from './AddPlantScreen';
import EditPlantScreen from './EditPlantScreen';

const Stack = createNativeStackNavigator();

export default function MainNavigator({ plants, setPlants, customPlants, setCustomPlants }) {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" options={{ title: '' }}>
        {(props) => <HomeScreen {...props} plants={plants} setPlants={setPlants} />}
      </Stack.Screen>
      <Stack.Screen name="AddPlant">
        {(props) => (
          <AddPlantScreen
            {...props}
            plants={plants}
            setPlants={setPlants}
            customPlants={customPlants}
            setCustomPlants={setCustomPlants}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="EditPlant">
        {(props) => (
          <EditPlantScreen {...props} plants={plants} setPlants={setPlants} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
