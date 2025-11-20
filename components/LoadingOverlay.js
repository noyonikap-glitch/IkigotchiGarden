// components/LoadingOverlay.js
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Full-screen loading overlay with spinner and messages
 * @param {string} message - Primary loading message
 * @param {string} subMessage - Secondary loading message
 */
export default function LoadingOverlay({ 
  message = "Analyzing image...", 
  subMessage = "Be right back..." 
}) {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#4285f4" />
      <Text style={styles.loadingText}>{message}</Text>
      <Text style={styles.subLoadingText}>{subMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  subLoadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
});
