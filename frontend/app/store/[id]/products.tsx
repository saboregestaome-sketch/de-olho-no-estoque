import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/src/store/appStore';
import { useAuthStore } from '@/src/store/authStore';
import { ProductCard } from '@/src/components/ProductCard';
import { Footer } from '@/src/components/Footer';
import { PRODUCT_GROUPS, UNITS } from '@/src/types';

export default function Products() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { products, isLoading, loadProducts, createProduct, updateProduct, deleteProduct, stockCounts, loadStockCounts } = useAppStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState(PRODUCT_GROUPS[0]);
  const [formUnit, setFormUnit] = useState(UNITS[0]);
  const [formPrice, setFormPrice] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formMaxStock, setFormMaxStock] = useState('');

  useEffect(() => {
    if (id) {
      loadProducts(id);
      loadStockCounts(id);
    }
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProducts(id!), loadStockCounts(id!)]);
    setRefreshing(false);
  }, [id]);

  const resetForm = () => {
    setFormName('');
    setFormGroup(PRODUCT_GROUPS[0]);
    setFormUnit(UNITS[0]);
    setFormPrice('');
    setFormMinStock('');
    setFormMaxStock('');
    setEditingProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormGroup(product.group);
    setFormUnit(product.unit);
    setFormPrice(product.last_purchase_price.toString());
    setFormMinStock(product.min_stock.toString());
    setFormMaxStock(product.max_stock.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Erro', 'Digite o nome do produto');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName.trim(),
          group: formGroup,
          unit: formUnit,
          last_purchase_price: parseFloat(formPrice) || 0,
          min_stock: parseFloat(formMinStock) || 0,
          max_stock: parseFloat(formMaxStock) || 0,
        });
      } else {
        await createProduct({
          store_id: id!,
          name: formName.trim(),
          group: formGroup,
          unit: formUnit,
          last_purchase_price: parseFloat(formPrice) || 0,
          min_stock: parseFloat(formMinStock) || 0,
          max_stock: parseFloat(formMaxStock) || 0,
        });
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o produto');
    }
  };

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      'Excluir Produto',
      `Tem certeza que deseja excluir "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteProduct(productId),
        },
      ]
    );
  };

  // Get current stock for each product
  const getCurrentStock = (productId: string) => {
    const productCounts = stockCounts.filter(c => c.product_id === productId);
    if (productCounts.length === 0) return undefined;
    // Get the most recent count
    const sorted = productCounts.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].quantity;
  };

  // Filter products by group
  const filteredProducts = selectedGroup 
    ? products.filter(p => p.group === selectedGroup)
    : products;

  // Get unique groups from products
  const usedGroups = [...new Set(products.map(p => p.group))];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Produtos</Text>
        {user?.role === 'admin' && (
          <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Group Filter */}
      {usedGroups.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, !selectedGroup && styles.filterChipActive]}
            onPress={() => setSelectedGroup(null)}
          >
            <Text style={[styles.filterText, !selectedGroup && styles.filterTextActive]}>
              Todos ({products.length})
            </Text>
          </TouchableOpacity>
          {usedGroups.map(group => (
            <TouchableOpacity
              key={group}
              style={[styles.filterChip, selectedGroup === group && styles.filterChipActive]}
              onPress={() => setSelectedGroup(group)}
            >
              <Text style={[styles.filterText, selectedGroup === group && styles.filterTextActive]}>
                {group} ({products.filter(p => p.group === group).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a5f2a']} />
        }
      >
        {isLoading && products.length === 0 ? (
          <ActivityIndicator size="large" color="#1a5f2a" style={styles.loader} />
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
            {user?.role === 'admin' && (
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Adicionar Produto</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              currentStock={getCurrentStock(product.id)}
              showActions={user?.role === 'admin'}
              onEdit={() => openEditModal(product)}
              onDelete={() => handleDelete(product.id, product.name)}
            />
          ))
        )}
      </ScrollView>

      <Footer />

      {/* Product Form Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </Text>

              <Text style={styles.inputLabel}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Filé Mignon"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.inputLabel}>Grupo</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
              >
                {PRODUCT_GROUPS.map(group => (
                  <TouchableOpacity
                    key={group}
                    style={[styles.optionChip, formGroup === group && styles.optionChipActive]}
                    onPress={() => setFormGroup(group)}
                  >
                    <Text style={[styles.optionText, formGroup === group && styles.optionTextActive]}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Unidade</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
              >
                {UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.optionChip, formUnit === unit && styles.optionChipActive]}
                    onPress={() => setFormUnit(unit)}
                  >
                    <Text style={[styles.optionText, formUnit === unit && styles.optionTextActive]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Preço Última Compra (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="decimal-pad"
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Estoque Mínimo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={formMinStock}
                    onChangeText={setFormMinStock}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Estoque Máximo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={formMaxStock}
                    onChangeText={setFormMaxStock}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.confirmButtonText}>
                    {editingProduct ? 'Salvar' : 'Criar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a5f2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    padding: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1a5f2a',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a5f2a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  optionsScroll: {
    marginBottom: 16,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  optionChipActive: {
    backgroundColor: '#1a5f2a',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#1a5f2a',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
