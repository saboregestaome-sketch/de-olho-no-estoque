import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  currentStock?: number;
  showActions?: boolean;
}

const GROUP_COLORS: Record<string, string> = {
  'Proteínas': '#e53935',
  'Hortifruti': '#43a047',
  'Lacticínios': '#1e88e5',
  'Secos': '#f9a825',
  'Limpeza': '#8e24aa',
  'Outros': '#757575',
};

export function ProductCard({ product, onPress, onEdit, onDelete, currentStock, showActions }: ProductCardProps) {
  const groupColor = GROUP_COLORS[product.group] || '#757575';
  const stockStatus = currentStock !== undefined ? getStockStatus(currentStock, product.min_stock, product.max_stock) : null;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.groupIndicator, { backgroundColor: groupColor }]} />
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.details}>
          <Text style={styles.group}>{product.group}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.unit}>{product.unit}</Text>
          {product.last_purchase_price > 0 && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.price}>R$ {product.last_purchase_price.toFixed(2)}</Text>
            </>
          )}
        </View>
        {currentStock !== undefined && (
          <View style={styles.stockRow}>
            <Text style={[styles.stock, stockStatus?.style]}>
              Estoque: {currentStock.toFixed(1)} {product.unit}
            </Text>
            {stockStatus?.icon && (
              <Ionicons name={stockStatus.icon} size={16} color={stockStatus.color} />
            )}
          </View>
        )}
        <Text style={styles.limits}>
          Mín: {product.min_stock} | Máx: {product.max_stock}
        </Text>
      </View>
      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Ionicons name="pencil" size={18} color="#1a5f2a" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Ionicons name="trash" size={18} color="#dc3545" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function getStockStatus(current: number, min: number, max: number) {
  if (current < min) {
    return {
      style: { color: '#dc3545' },
      icon: 'warning' as const,
      color: '#dc3545',
    };
  }
  if (max > 0 && current > max) {
    return {
      style: { color: '#ff9800' },
      icon: 'arrow-up' as const,
      color: '#ff9800',
    };
  }
  return {
    style: { color: '#43a047' },
    icon: 'checkmark-circle' as const,
    color: '#43a047',
  };
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  groupIndicator: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  group: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    marginHorizontal: 6,
    color: '#ccc',
  },
  unit: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 12,
    color: '#1a5f2a',
    fontWeight: '500',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  stock: {
    fontSize: 14,
    fontWeight: '500',
  },
  limits: {
    fontSize: 11,
    color: '#999',
  },
  actions: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});
