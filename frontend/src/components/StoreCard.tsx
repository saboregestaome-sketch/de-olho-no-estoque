import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Store } from '../types';

interface StoreCardProps {
  store: Store;
  onPress: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function StoreCard({ store, onPress, onDelete, showDelete }: StoreCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Ionicons name="storefront" size={28} color="#1a5f2a" />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{store.name}</Text>
        {store.buyer_whatsapp ? (
          <View style={styles.whatsappContainer}>
            <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
            <Text style={styles.whatsapp}>{store.buyer_whatsapp}</Text>
          </View>
        ) : null}
      </View>
      {showDelete && onDelete ? (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={24} color="#999" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  whatsappContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  whatsapp: {
    fontSize: 13,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
});
