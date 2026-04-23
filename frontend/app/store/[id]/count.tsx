import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, RefreshControl, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAppStore } from '@/src/store/appStore';
import { useAuthStore } from '@/src/store/authStore';
import { Footer } from '@/src/components/Footer';
import { api } from '@/src/services/api';
import { UNITS } from '@/src/types';

export default function StockCount() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { products, stores, stockCounts, isLoading, loadProducts, loadStockCounts, createStockCount, loadStores, updateProduct } = useAppStore();

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const store = stores.find(s => s.id === id);

  useEffect(() => {
    if (id) {
      loadProducts(id);
      loadStockCounts(id, undefined, currentMonth, currentYear);
      if (stores.length === 0) {
        loadStores();
      }
    }
  }, [id]);

  // Initialize quantities from existing counts
  useEffect(() => {
    const weekCounts = stockCounts.filter(
      c => c.week_number === selectedWeek && c.month === currentMonth && c.year === currentYear
    );
    const newQuantities: Record<string, string> = {};
    weekCounts.forEach(count => {
      newQuantities[count.product_id] = count.quantity.toString();
    });
    setQuantities(newQuantities);
  }, [selectedWeek, stockCounts]);

  // Initialize selected units from products
  useEffect(() => {
    const units: Record<string, string> = {};
    products.forEach(product => {
      units[product.id] = product.unit;
    });
    setSelectedUnits(units);
  }, [products]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadProducts(id!),
      loadStockCounts(id!, undefined, currentMonth, currentYear)
    ]);
    setRefreshing(false);
  }, [id, currentMonth, currentYear]);

  const handleQuantityChange = (productId: string, value: string) => {
    setQuantities(prev => ({ ...prev, [productId]: value }));
  };

  const handleUnitChange = async (productId: string, newUnit: string) => {
    setSelectedUnits(prev => ({ ...prev, [productId]: newUnit }));
    // Update product unit in database
    try {
      await updateProduct(productId, { unit: newUnit });
    } catch (error) {
      console.log('Error updating unit:', error);
    }
    setShowUnitModal(false);
    setEditingProductId(null);
  };

  const openUnitSelector = (productId: string) => {
    setEditingProductId(productId);
    setShowUnitModal(true);
  };

  const handleSaveAll = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const promises = products.map(product => {
        const qty = parseFloat(quantities[product.id] || '0');
        return createStockCount({
          store_id: id!,
          product_id: product.id,
          employee_name: user.name,
          week_number: selectedWeek,
          month: currentMonth,
          year: currentYear,
          quantity: qty,
        });
      });
      await Promise.all(promises);
      Alert.alert('Sucesso', 'Contagem salva com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a contagem');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReport = async () => {
    if (!store) {
      Alert.alert('Erro', 'Loja não encontrada');
      return;
    }

    if (!store.buyer_whatsapp) {
      Alert.alert(
        'WhatsApp não configurado',
        'O número do WhatsApp do comprador não foi configurado. Solicite ao administrador para configurar nas configurações da loja.'
      );
      return;
    }

    setSending(true);
    try {
      // First save all counts
      await handleSaveAll();
      
      // Get report
      const report = await api.getWeeklyReport(id!, selectedWeek, currentMonth, currentYear);
      
      // Open WhatsApp with the message
      const phoneNumber = store.buyer_whatsapp.replace(/\D/g, '');
      const message = encodeURIComponent(report.report_message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório');
    } finally {
      setSending(false);
    }
  };

  // Group products by category
  const productsByGroup = products.reduce((acc, product) => {
    if (!acc[product.group]) {
      acc[product.group] = [];
    }
    acc[product.group].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  const weeks = [1, 2, 3, 4, 5];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contagem de Estoque</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <Text style={styles.weekLabel}>Semana:</Text>
        <View style={styles.weekButtons}>
          {weeks.map(week => (
            <TouchableOpacity
              key={week}
              style={[styles.weekButton, selectedWeek === week && styles.weekButtonActive]}
              onPress={() => setSelectedWeek(week)}
            >
              <Text style={[styles.weekText, selectedWeek === week && styles.weekTextActive]}>
                {week}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.monthInfo}>
        <Ionicons name="calendar" size={16} color="#666" />
        <Text style={styles.monthText}>
          {currentMonth.toString().padStart(2, '0')}/{currentYear}
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a5f2a']} />
        }
      >
        {isLoading && products.length === 0 ? (
          <ActivityIndicator size="large" color="#1a5f2a" style={styles.loader} />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
            <Text style={styles.emptySubtext}>Solicite ao administrador para cadastrar produtos</Text>
          </View>
        ) : (
          Object.entries(productsByGroup).map(([group, groupProducts]) => (
            <View key={group} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{group}</Text>
              {groupProducts.map(product => (
                <View key={product.id} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <TouchableOpacity 
                      style={styles.unitSelector}
                      onPress={() => openUnitSelector(product.id)}
                    >
                      <Text style={styles.productUnit}>{selectedUnits[product.id] || product.unit}</Text>
                      <Ionicons name="chevron-down" size={14} color="#1a5f2a" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.quantityInput}
                    placeholder="0"
                    value={quantities[product.id] || ''}
                    onChangeText={(value) => handleQuantityChange(product.id, value)}
                    keyboardType="decimal-pad"
                  />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Unit Selector Modal */}
      <Modal visible={showUnitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Unidade</Text>
            <View style={styles.unitOptions}>
              {UNITS.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitOption,
                    editingProductId && selectedUnits[editingProductId] === unit && styles.unitOptionActive
                  ]}
                  onPress={() => editingProductId && handleUnitChange(editingProductId, unit)}
                >
                  <Text style={[
                    styles.unitOptionText,
                    editingProductId && selectedUnits[editingProductId] === unit && styles.unitOptionTextActive
                  ]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.cancelModalButton}
              onPress={() => {
                setShowUnitModal(false);
                setEditingProductId(null);
              }}
            >
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Actions */}
      {products.length > 0 && (
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.buttonDisabled]} 
            onPress={handleSaveAll}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#1a5f2a" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#1a5f2a" />
                <Text style={styles.saveButtonText}>Salvar Contagem</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sendButton, sending && styles.buttonDisabled]} 
            onPress={handleSendReport}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.sendButtonText}>Enviar Relatório</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Footer />
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
  weekSelector: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 16,
  },
  weekButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weekButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekButtonActive: {
    backgroundColor: '#1a5f2a',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  weekTextActive: {
    color: '#fff',
  },
  monthInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  groupSection: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f2a',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#1a5f2a',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  productUnit: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  quantityInput: {
    width: 80,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    gap: 8,
  },
  saveButtonText: {
    color: '#1a5f2a',
    fontSize: 15,
    fontWeight: '600',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#25D366',
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
