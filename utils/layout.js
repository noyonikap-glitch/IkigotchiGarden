// utils/layout.js
import { Dimensions } from 'react-native';

export const screenWidth = Dimensions.get('window').width;

export const getCardWidth = (numCols = 2, spacing = 16) => {
  return (screenWidth - (numCols + 1) * spacing) / numCols;
};
