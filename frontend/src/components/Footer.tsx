import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Footer() {
  return (
    <View style={styles.container}>
      <Ionicons name="restaurant" size={16} color="#666" />
      <Text style={styles.text}>Chef Felipe Matias</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
