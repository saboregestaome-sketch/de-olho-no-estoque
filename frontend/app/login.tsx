import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { Footer } from '@/src/components/Footer';

export default function Login() {
  const router = useRouter();
  const { user, login, logout } = useAuthStore();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Digite seu nome');
      return;
    }

    if (isAdminLogin && !password) {
      Alert.alert('Erro', 'Digite a senha de administrador');
      return;
    }

    const success = await login(name.trim(), isAdminLogin ? password : undefined);
    
    if (success) {
      router.replace('/');
    } else {
      Alert.alert('Erro', 'Senha incorreta');
    }
  };

  const handleLogout = async () => {
    await logout();
    setName('');
    setPassword('');
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Minha Conta</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.loggedInContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#1a5f2a" />
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <View style={[styles.roleBadgeLarge, user.role === 'admin' && styles.adminBadgeLarge]}>
            <Ionicons 
              name={user.role === 'admin' ? 'shield-checkmark' : 'person'} 
              size={18} 
              color={user.role === 'admin' ? '#1a5f2a' : '#666'} 
            />
            <Text style={[styles.roleTextLarge, user.role === 'admin' && styles.adminTextLarge]}>
              {user.role === 'admin' ? 'Administrador' : 'Funcionário'}
            </Text>
          </View>

          <View style={styles.permissionsCard}>
            <Text style={styles.permissionsTitle}>Suas Permissões</Text>
            <View style={styles.permissionItem}>
              <Ionicons name="checkmark-circle" size={20} color="#1a5f2a" />
              <Text style={styles.permissionText}>Realizar contagem de estoque</Text>
            </View>
            <View style={styles.permissionItem}>
              <Ionicons name="checkmark-circle" size={20} color="#1a5f2a" />
              <Text style={styles.permissionText}>Enviar relatório para compras</Text>
            </View>
            {user.role === 'admin' && (
              <>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#1a5f2a" />
                  <Text style={styles.permissionText}>Cadastrar e editar produtos</Text>
                </View>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#1a5f2a" />
                  <Text style={styles.permissionText}>Gerenciar lojas</Text>
                </View>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#1a5f2a" />
                  <Text style={styles.permissionText}>Visualizar relatórios e curva ABC</Text>
                </View>
                <View style={styles.permissionItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#1a5f2a" />
                  <Text style={styles.permissionText}>Configurar número do comprador</Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#dc3545" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="cube" size={60} color="#1a5f2a" />
            <Text style={styles.logoText}>De Olho no Estoque</Text>
            <Text style={styles.logoSubtext}>Sistema de Gestão de Estoque</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, !isAdminLogin && styles.activeTab]} 
                onPress={() => setIsAdminLogin(false)}
              >
                <Ionicons name="person" size={18} color={!isAdminLogin ? '#1a5f2a' : '#999'} />
                <Text style={[styles.tabText, !isAdminLogin && styles.activeTabText]}>Funcionário</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, isAdminLogin && styles.activeTab]} 
                onPress={() => setIsAdminLogin(true)}
              >
                <Ionicons name="shield-checkmark" size={18} color={isAdminLogin ? '#1a5f2a' : '#999'} />
                <Text style={[styles.tabText, isAdminLogin && styles.activeTabText]}>Administrador</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Seu Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            {isAdminLogin && (
              <>
                <Text style={styles.inputLabel}>Senha de Administrador</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Digite a senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={22} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Ionicons name="log-in" size={20} color="#fff" />
              <Text style={styles.loginButtonText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a5f2a',
    marginTop: 12,
  },
  logoSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#999',
  },
  activeTabText: {
    color: '#1a5f2a',
    fontWeight: '600',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeButton: {
    padding: 14,
  },
  loginButton: {
    backgroundColor: '#1a5f2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loggedInContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  adminBadgeLarge: {
    backgroundColor: '#e8f5e9',
  },
  roleTextLarge: {
    fontSize: 14,
    color: '#666',
  },
  adminTextLarge: {
    color: '#1a5f2a',
    fontWeight: '500',
  },
  permissionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#555',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc3545',
    gap: 8,
  },
  logoutText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
});
