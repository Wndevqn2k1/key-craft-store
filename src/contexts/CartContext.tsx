import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { CartItemWithDetails, Product, PriceTier } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cartItems: CartItemWithDetails[];
  isLoading: boolean;
  cartCount: number;
  cartTotal: number;
  addToCart: (productId: string, priceTierId: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.price_tier.price,
    0
  );

  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data: items, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!items || items.length === 0) {
        setCartItems([]);
        return;
      }

      // Fetch products and price tiers separately
      const productIds = [...new Set(items.map(item => item.product_id))];
      const priceTierIds = [...new Set(items.map(item => item.price_tier_id))];

      const [productsRes, tiersRes] = await Promise.all([
        supabase.from('products').select('*').in('id', productIds),
        supabase.from('price_tiers').select('*').in('id', priceTierIds),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (tiersRes.error) throw tiersRes.error;

      const productsMap = new Map(productsRes.data?.map(p => [p.id, p]) || []);
      const tiersMap = new Map(tiersRes.data?.map(t => [t.id, t]) || []);

      const cartWithDetails: CartItemWithDetails[] = items
        .map(item => {
          const product = productsMap.get(item.product_id);
          const priceTier = tiersMap.get(item.price_tier_id);
          
          if (!product || !priceTier) return null;

          return {
            ...item,
            product: product as Product,
            price_tier: priceTier as PriceTier,
          };
        })
        .filter((item): item is CartItemWithDetails => item !== null);

      setCartItems(cartWithDetails);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, priceTierId: string) => {
    if (!user) {
      toast({
        title: 'Cần đăng nhập',
        description: 'Vui lòng đăng nhập để thêm vào giỏ hàng',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if item already in cart
      const existing = cartItems.find(
        item => item.product_id === productId && item.price_tier_id === priceTierId
      );

      if (existing) {
        await updateQuantity(existing.id, existing.quantity + 1);
        return;
      }

      const { error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: productId,
        price_tier_id: priceTierId,
        quantity: 1,
      });

      if (error) throw error;

      toast({
        title: 'Đã thêm vào giỏ hàng',
        description: 'Sản phẩm đã được thêm vào giỏ hàng của bạn',
      });

      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm vào giỏ hàng',
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      setCartItems(prev => prev.filter(item => item.id !== cartItemId));
      
      toast({
        title: 'Đã xóa',
        description: 'Sản phẩm đã được xóa khỏi giỏ hàng',
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa sản phẩm',
        variant: 'destructive',
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;

      setCartItems(prev =>
        prev.map(item =>
          item.id === cartItemId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật số lượng',
        variant: 'destructive',
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
