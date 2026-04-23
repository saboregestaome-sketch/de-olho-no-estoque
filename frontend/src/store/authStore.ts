import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User, UserRole } from '../types';

const ADMIN_PASSWORD = '6112';
const USER_KEY = 'user_data';

// Helper functions for cross-platform storage
const saveUser = async (user: User) => {
  try {
    const userJson = JSON.stringify(user);
    if (Platform.OS === 'web') {
      localStorage.setItem(USER_KEY, userJson);
    } else {
      await SecureStore.setItemAsync(USER_KEY, userJson);
    }
  } catch (error) {
    console.log('Error saving user:', error);
  }
};

const loadUserData = async (): Promise<User | null> => {
  try {
    let userJson: string | null = null;
    if (Platform.OS === 'web') {
      userJson = localStorage.getItem(USER_KEY);
    } else {
      userJson = await SecureStore.getItemAsync(USER_KEY);
    }
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (error) {
    console.log('Error loading user:', error);
  }
  return null;
};

const removeUser = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.log('Error removing user:', error);
  }
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  selectedStoreId: string | null;
  login: (name: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setSelectedStore: (storeId: string | null) => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  selectedStoreId: null,

  login: async (name: string, password?: string) => {
    let role: UserRole = 'employee';
    
    if (password) {
      if (password === ADMIN_PASSWORD) {
        role = 'admin';
      } else {
        return false; // Wrong password
      }
    }

    const user: User = { name, role };
    await saveUser(user);
    set({ user });
    return true;
  },

  logout: async () => {
    await removeUser();
    set({ user: null, selectedStoreId: null });
  },

  setSelectedStore: (storeId) => {
    set({ selectedStoreId: storeId });
  },

  loadUser: async () => {
    try {
      const user = await loadUserData();
      set({ user, isLoading: false });
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },
}));
