export interface Store {
  id: string;
  name: string;
  buyer_whatsapp: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  group: string;
  unit: string;
  last_purchase_price: number;
  min_stock: number;
  max_stock: number;
  created_at: string;
}

export interface StockCount {
  id: string;
  store_id: string;
  product_id: string;
  employee_name: string;
  week_number: number;
  month: number;
  year: number;
  quantity: number;
  created_at: string;
}

export interface ProductAnalytics {
  id: string;
  name: string;
  group: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  last_price: number;
  total_consumption: number;
  avg_consumption: number;
  consumption_value: number;
  stock_value: number;
  suggested_quantity?: number;
  estimated_cost?: number;
}

export interface StoreAnalytics {
  total_stock_value: number;
  total_consumption_value: number;
  products_below_min: ProductAnalytics[];
  products_above_max: ProductAnalytics[];
  low_turnover_products: ProductAnalytics[];
  high_cost_products: ProductAnalytics[];
  purchase_suggestions: ProductAnalytics[];
  abc_curve: {
    A: ProductAnalytics[];
    B: ProductAnalytics[];
    C: ProductAnalytics[];
  };
  consumption_by_group: Record<string, number>;
  product_analytics: ProductAnalytics[];
}

export interface WeeklyReport {
  store_name: string;
  buyer_whatsapp: string;
  report_message: string;
  analytics: StoreAnalytics;
}

export type UserRole = 'employee' | 'admin';

export interface User {
  name: string;
  role: UserRole;
}

export const PRODUCT_GROUPS = [
  'Proteínas',
  'Hortifruti',
  'Lacticínios',
  'Secos',
  'Limpeza',
  'Outros'
];

export const UNITS = [
  'kg',
  'un',
  'lt',
  'cx',
  'pct',
  'g',
  'ml'
];
