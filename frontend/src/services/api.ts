import { supabase } from '../lib/supabase';
import { Store, Product, StockCount, StoreAnalytics, WeeklyReport } from '../types';
import { analyticsService } from './analyticsService';

class ApiService {
  // Stores
  async getStores(): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Store[];
  }

  async getStore(id: string): Promise<Store> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Store;
  }

  async createStore(name: string, buyer_whatsapp: string = ''): Promise<Store> {
    const { data, error } = await supabase
      .from('stores')
      .insert([{ name, buyer_whatsapp }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Store;
  }

  async updateStoreSettings(storeId: string, buyer_whatsapp: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({ buyer_whatsapp })
      .eq('id', storeId);
    
    if (error) throw error;
  }

  async deleteStore(id: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Products
  async getProducts(storeId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('name');
    
    if (error) throw error;
    return data as Product[];
  }

  async getProduct(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Stock Counts
  async getStockCounts(storeId: string, week?: number, month?: number, year?: number): Promise<StockCount[]> {
    let query = supabase
      .from('stock_counts')
      .select('*')
      .eq('store_id', storeId);
    
    if (week) query = query.eq('week_number', week);
    if (month) query = query.eq('month', month);
    if (year) query = query.eq('year', year);
    
    const { data, error } = await query;
    if (error) throw error;
    return data as StockCount[];
  }

  async getProductStockHistory(productId: string): Promise<StockCount[]> {
    const { data, error } = await supabase
      .from('stock_counts')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data as StockCount[];
  }

  async createStockCount(count: Omit<StockCount, 'id' | 'created_at'>): Promise<StockCount> {
    // Check if there's already a count for this product/week/month/year
    const { data: existing } = await supabase
      .from('stock_counts')
      .select('*')
      .eq('product_id', count.product_id)
      .eq('week_number', count.week_number)
      .eq('month', count.month)
      .eq('year', count.year)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('stock_counts')
        .update({
          quantity: count.quantity,
          employee_name: count.employee_name,
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as StockCount;
    } else {
      const { data, error } = await supabase
        .from('stock_counts')
        .insert([count])
        .select()
        .single();
      
      if (error) throw error;
      return data as StockCount;
    }
  }

  // Analytics
  async getStoreAnalytics(storeId: string, month?: number, year?: number): Promise<StoreAnalytics> {
    // Get all products
    const products = await this.getProducts(storeId);
    
    // Get stock counts
    const stockCounts = await this.getStockCounts(storeId, undefined, month, year);
    
    return analyticsService.calculateStoreAnalytics(products, stockCounts);
  }

  async getWeeklyReport(storeId: string, week: number, month: number, year: number): Promise<WeeklyReport> {
    const store = await this.getStore(storeId);
    const analytics = await this.getStoreAnalytics(storeId, month, year);
    
    const message = analyticsService.generateWeeklyReportMessage(
      store.name,
      analytics,
      week,
      month,
      year
    );

    return {
      store_name: store.name,
      buyer_whatsapp: store.buyer_whatsapp || '',
      report_message: message,
      analytics: analytics
    };
  }
}

export const api = new ApiService();
