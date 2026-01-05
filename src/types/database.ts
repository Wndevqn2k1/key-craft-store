// Custom database types until auto-generated types are updated
export type AppRole = 'admin' | 'user' | 'reseller';
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled';
export type KeyStatus = 'available' | 'sold' | 'expired';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  category: string;
  rating: number;
  reviews_count: number;
  features: string[];
  badge: string | null;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceTier {
  id: string;
  product_id: string;
  duration: string;
  duration_label: string;
  price: number;
  reseller_price: number | null;
  original_price: number | null;
  is_popular: boolean;
  created_at: string;
}

export interface ProductKey {
  id: string;
  product_id: string;
  price_tier_id: string;
  key_value: string;
  status: KeyStatus;
  sold_at: string | null;
  buyer_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_method: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  price_tier_id: string;
  quantity: number;
  unit_price: number;
  key_id: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  price_tier_id: string;
  quantity: number;
  created_at: string;
}

// Extended types with relations
export interface ProductWithTiers extends Product {
  price_tiers: PriceTier[];
}

export interface CartItemWithDetails extends CartItem {
  product: Product;
  price_tier: PriceTier;
}

export interface OrderItemWithDetails extends OrderItem {
  product: Product;
  price_tier: PriceTier;
  product_key?: ProductKey;
}

export interface OrderWithItems extends Order {
  order_items: OrderItemWithDetails[];
}
