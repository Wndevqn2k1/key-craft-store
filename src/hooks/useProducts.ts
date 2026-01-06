import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  category: string;
  badge: string | null;
  rating: number | null;
  reviews_count: number | null;
  in_stock: boolean | null;
  features: string[] | null;
  price_tiers: PriceTier[];
  display_order?: number | null;
  is_featured?: boolean | null;
  created_at: string;
}

export interface PriceTier {
  id: string;
  duration: string;
  duration_label: string;
  price: number;
  reseller_price?: number | null;
  original_price: number | null;
  is_popular: boolean | null;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, price_tiers(*)')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Product[];
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, price_tiers(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as Product | null;
    },
    enabled: !!id,
  });
};
