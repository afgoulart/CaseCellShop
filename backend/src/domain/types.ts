export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface Order {
  id: string;
  product_id: number;
  quantity: number;
  status: 'processing' | 'confirmed' | 'failed';
  idempotency_key: string;
  invoice: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_price?: number;
}

export interface StockResult {
  success: boolean;
  currentStock: number;
}
