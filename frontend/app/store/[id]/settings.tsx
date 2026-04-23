import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/src/store/appStore';
import { Footer } from '@/src/components/Footer';

export default function Settings() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stores, loadStores, updateStoreSettings, isLoading } = useAppStore();

  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);

  const store = stores.find(s => s.id === id);

  useEffect(() => {
    if (stores.length === 0) {
      loadStores();
    }
  }, []);

  useEffect(() => {
    if (store) {
      setBuyerWhatsapp(store.buyer_whatsapp || '');
    }
  }, [store]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStoreSettings(id!, buyerWhatsapp.trim());
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !store) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5f2a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.cardTitle}>WhatsApp do Comprador</Text>
            </View>
            
            <Text style={styles.description}>
              Configure o número de WhatsApp que receberá os relatórios de estoque.
              Use o formato internacional (ex: 5511999999999).
            </Text>

            <Text style={styles.inputLabel}>Número de WhatsApp</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 5511999999999"
              value={buyerWhatsapp}
              onChangeText={setBuyerWhatsapp}
              keyboardType="phone-pad"
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                O relatório será enviado automaticamente quando o funcionário clicar em "Enviar Relatório" após a contagem.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Salvar Configurações</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Store Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="storefront" size={24} color="#1a5f2a" />
              <Text style={styles.cardTitle}>Informações da Loja</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome:</Text>
              <Text style={styles.infoValue}>{store.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Criada em:</Text>
              <Text style={styles.infoValue}>
                {new Date(store.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#1a5f2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
