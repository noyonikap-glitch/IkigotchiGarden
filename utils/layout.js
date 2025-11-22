// utils/layout.js
import { Dimensions } from 'react-native';

// Base dimensions (iPhone 11/XR as reference device)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const screenWidth = Dimensions.get('window').width;
export const screenHeight = Dimensions.get('window').height;

// Scale based on width (for horizontal sizing: width, horizontal margins/padding)
export const scale = (size) => (screenWidth / guidelineBaseWidth) * size;

// Scale based on height (for vertical sizing: height, vertical margins/padding, top/bottom positions)
export const verticalScale = (size) => (screenHeight / guidelineBaseHeight) * size;

// Moderate scale for fonts (prevents oversizing on tablets)
// factor = 0.5 is default - adjust if needed (higher = less scaling)
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Helper for card widths (existing function)
export const getCardWidth = (numCols = 2, spacing = 16) => {
  return (screenWidth - (numCols + 1) * spacing) / numCols;
};
