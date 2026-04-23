import { Store, Product, StockCount, StoreAnalytics, WeeklyReport } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/api`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('API Request:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Stores
  async getStores(): Promise<Store[]> {
    return this.request<Store[]>('/stores');
  }

  async getStore(id: string): Promise<Store> {
    return this.request<Store>(`/stores/${id}`);
  }

  async createStore(name: string, buyer_whatsapp: string = ''): Promise<Store> {
    return this.request<Store>('/stores', {
      method: 'POST',
      body: JSON.stringify({ name, buyer_whatsapp }),
    });
  }

  async updateStoreSettings(storeId: string, buyer_whatsapp: string): Promise<void> {
    return this.request<void>(`/stores/${storeId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ buyer_whatsapp }),
    });
  }

  async deleteStore(id: string): Promise<void> {
    return this.request<void>(`/stores/${id}`, { method: 'DELETE' });
  }

  // Products
  async getProducts(storeId: string): Promise<Product[]> {
    return this.request<Product[]>(`/products/store/${storeId}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/products/${id}`, { method: 'DELETE' });
  }

  // Stock Counts
  async getStockCounts(storeId: string, week?: number, month?: number, year?: number): Promise<StockCount[]> {
    let endpoint = `/stock-counts/store/${storeId}`;
    const params = new URLSearchParams();
    if (week) params.append('week', week.toString());
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request<StockCount[]>(endpoint);
  }

  async getProductStockHistory(productId: string): Promise<StockCount[]> {
    return this.request<StockCount[]>(`/stock-counts/product/${productId}`);
  }

  async createStockCount(count: Omit<StockCount, 'id' | 'created_at'>): Promise<StockCount> {
    return this.request<StockCount>('/stock-counts', {
      method: 'POST',
      body: JSON.stringify(count),
    });
  }

  // Analytics
  async getStoreAnalytics(storeId: string, month?: number, year?: number): Promise<StoreAnalytics> {
    let endpoint = `/analytics/store/${storeId}`;
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.request<StoreAnalytics>(endpoint);
  }

  async getWeeklyReport(storeId: string, week: number, month: number, year: number): Promise<WeeklyReport> {
    return this.request<WeeklyReport>(`/reports/store/${storeId}/weekly?week=${week}&month=${month}&year=${year}`);
  }
}

export const api = new ApiService();
