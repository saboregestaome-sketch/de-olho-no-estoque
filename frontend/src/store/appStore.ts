import { create } from 'zustand';
import { Store, Product, StockCount, StoreAnalytics } from '../types';
import { api } from '../services/api';

interface AppState {
  stores: Store[];
  products: Product[];
  stockCounts: StockCount[];
  analytics: StoreAnalytics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadStores: () => Promise<void>;
  loadProducts: (storeId: string) => Promise<void>;
  loadStockCounts: (storeId: string, week?: number, month?: number, year?: number) => Promise<void>;
  loadAnalytics: (storeId: string, month?: number, year?: number) => Promise<void>;
  
  createStore: (name: string, buyer_whatsapp?: string) => Promise<Store>;
  deleteStore: (id: string) => Promise<void>;
  updateStoreSettings: (storeId: string, buyer_whatsapp: string) => Promise<void>;
  
  createProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  createStockCount: (count: Omit<StockCount, 'id' | 'created_at'>) => Promise<void>;
  
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  stores: [],
  products: [],
  stockCounts: [],
  analytics: null,
  isLoading: false,
  error: null,

  loadStores: async () => {
    set({ isLoading: true, error: null });
    try {
      const stores = await api.getStores();
      set({ stores, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadProducts: async (storeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const products = await api.getProducts(storeId);
      set({ products, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadStockCounts: async (storeId: string, week?: number, month?: number, year?: number) => {
    set({ isLoading: true, error: null });
    try {
      const stockCounts = await api.getStockCounts(storeId, week, month, year);
      set({ stockCounts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadAnalytics: async (storeId: string, month?: number, year?: number) => {
    set({ isLoading: true, error: null });
    try {
      const analytics = await api.getStoreAnalytics(storeId, month, year);
      set({ analytics, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createStore: async (name: string, buyer_whatsapp: string = '') => {
    set({ isLoading: true, error: null });
    try {
      const store = await api.createStore(name, buyer_whatsapp);
      set((state) => ({ stores: [...state.stores, store], isLoading: false }));
      return store;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteStore: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteStore(id);
      set((state) => ({ 
        stores: state.stores.filter(s => s.id !== id), 
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateStoreSettings: async (storeId: string, buyer_whatsapp: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.updateStoreSettings(storeId, buyer_whatsapp);
      set((state) => ({
        stores: state.stores.map(s => 
          s.id === storeId ? { ...s, buyer_whatsapp } : s
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      const newProduct = await api.createProduct(product);
      set((state) => ({ 
        products: [...state.products, newProduct], 
        isLoading: false 
      }));
      return newProduct;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.updateProduct(id, updates);
      set((state) => ({
        products: state.products.map(p => p.id === id ? updated : p),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteProduct(id);
      set((state) => ({ 
        products: state.products.filter(p => p.id !== id), 
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createStockCount: async (count) => {
    set({ isLoading: true, error: null });
    try {
      const newCount = await api.createStockCount(count);
      set((state) => {
        // Check if count already exists for this product/week
        const existingIndex = state.stockCounts.findIndex(
          c => c.product_id === count.product_id && 
               c.week_number === count.week_number &&
               c.month === count.month &&
               c.year === count.year
        );
        
        if (existingIndex >= 0) {
          const updated = [...state.stockCounts];
          updated[existingIndex] = newCount;
          return { stockCounts: updated, isLoading: false };
        }
        
        return { stockCounts: [...state.stockCounts, newCount], isLoading: false };
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
