import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useAppStore } from '@/src/store/appStore';
import { StoreCard } from '@/src/components/StoreCard';
import { Footer } from '@/src/components/Footer';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { stores, isLoading, loadStores, createStore, deleteStore } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreWhatsapp, setNewStoreWhatsapp] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      loadStores();
    }
  }, [user, authLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores();
    setRefreshing(false);
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      Alert.alert('Erro', 'Digite o nome da loja');
      return;
    }
    try {
      await createStore(newStoreName.trim(), newStoreWhatsapp.trim());
      setShowCreateModal(false);
      setNewStoreName('');
      setNewStoreWhatsapp('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a loja');
    }
  };

  const handleDeleteStore = (storeId: string, storeName: string) => {
    Alert.alert(
      'Excluir Loja',
      `Tem certeza que deseja excluir "${storeName}"? Todos os produtos e contagens serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteStore(storeId),
        },
      ]
    );
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5f2a" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cube" size={28} color="#fff" />
          <Text style={styles.headerTitle}>De Olho no Estoque</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.userButton}>
          <Ionicons name="person-circle" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>Olá, {user.name}!</Text>
        <View style={[styles.roleBadge, user.role === 'admin' && styles.adminBadge]}>
          <Ionicons 
            name={user.role === 'admin' ? 'shield-checkmark' : 'person'} 
            size={14} 
            color={user.role === 'admin' ? '#1a5f2a' : '#666'} 
          />
          <Text style={[styles.roleText, user.role === 'admin' && styles.adminText]}>
            {user.role === 'admin' ? 'Administrador' : 'Funcionário'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a5f2a']} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Minhas Lojas</Text>
          {user.role === 'admin' && (
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Criar Loja</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading && stores.length === 0 ? (
          <ActivityIndicator size="large" color="#1a5f2a" style={styles.loader} />
        ) : stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma loja cadastrada</Text>
            {user.role === 'admin' && (
              <Text style={styles.emptySubtext}>Toque em "Criar Loja" para começar</Text>
            )}
          </View>
        ) : (
          stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onPress={() => router.push(`/store/${store.id}`)}
              onDelete={user.role === 'admin' ? () => handleDeleteStore(store.id, store.name) : undefined}
              showDelete={user.role === 'admin'}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <Footer />

      {/* Create Store Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Nova Loja</Text>
            
            <Text style={styles.inputLabel}>Nome da Loja *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Restaurante Centro"
              value={newStoreName}
              onChangeText={setNewStoreName}
            />

            <Text style={styles.inputLabel}>WhatsApp do Comprador</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 5511999999999"
              value={newStoreWhatsapp}
              onChangeText={setNewStoreWhatsapp}
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowCreateModal(false);
                  setNewStoreName('');
                  setNewStoreWhatsapp('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleCreateStore}
              >
                <Text style={styles.confirmButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userButton: {
    padding: 4,
  },
  userInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadge: {
    backgroundColor: '#e8f5e9',
  },
  roleText: {
    fontSize: 12,
    color: '#666',
  },
  adminText: {
    color: '#1a5f2a',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a5f2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
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
