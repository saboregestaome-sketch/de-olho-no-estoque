import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { useAppStore } from '@/src/store/appStore';
import { Footer } from '@/src/components/Footer';

export default function StoreDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { stores, loadStores, isLoading } = useAppStore();

  const store = stores.find(s => s.id === id);

  useEffect(() => {
    if (stores.length === 0) {
      loadStores();
    }
  }, []);

  if (isLoading || !store) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carregando...</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5f2a" />
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    {
      icon: 'clipboard',
      title: 'Contagem de Estoque',
      subtitle: 'Realizar contagem semanal',
      color: '#1a5f2a',
      route: `/store/${id}/count`,
      roles: ['employee', 'admin'],
    },
    {
      icon: 'cube',
      title: 'Produtos',
      subtitle: 'Gerenciar produtos cadastrados',
      color: '#2196F3',
      route: `/store/${id}/products`,
      roles: ['admin'],
    },
    {
      icon: 'bar-chart',
      title: 'Relatórios e Análises',
      subtitle: 'Curva ABC, consumo e custos',
      color: '#ff9800',
      route: `/store/${id}/reports`,
      roles: ['admin'],
    },
    {
      icon: 'settings',
      title: 'Configurações',
      subtitle: 'WhatsApp do comprador',
      color: '#9c27b0',
      route: `/store/${id}/settings`,
      roles: ['admin'],
    },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'employee')
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store.name}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Store Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={40} color="#1a5f2a" />
          </View>
          <Text style={styles.storeName}>{store.name}</Text>
          {store.buyer_whatsapp ? (
            <View style={styles.whatsappInfo}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={styles.whatsappText}>Comprador: {store.buyer_whatsapp}</Text>
            </View>
          ) : (
            <Text style={styles.noWhatsapp}>WhatsApp do comprador não configurado</Text>
          )}
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Opções</Text>
        {filteredItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  whatsappInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  whatsappText: {
    fontSize: 14,
    color: '#666',
  },
  noWhatsapp: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
  },
});
