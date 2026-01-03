import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronLeft,
  ShoppingBag,
  User,
  Percent,
  Gift,
  Wallet,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';

interface PurchasedKey {
  productName: string;
  duration: string;
  keyValue: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cartItems, isLoading: cartLoading, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  
  const [userBalance, setUserBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedKeys, setPurchasedKeys] = useState<PurchasedKey[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const totalAmount = cartTotal;

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setUserBalance(Number(data.balance) || 0);
      }
    };
    fetchUserBalance();
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const amountNeeded = Math.max(0, totalAmount - userBalance);

  const handleBalancePayment = async () => {
    if (!user) {
      toast({ title: 'Lỗi', description: 'Vui lòng đăng nhập để thanh toán', variant: 'destructive' });
      return;
    }

    if (userBalance < totalAmount) {
      toast({ title: 'Số dư không đủ', description: 'Vui lòng nạp thêm tiền vào tài khoản', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'paid',
          payment_method: 'balance',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const keys: PurchasedKey[] = [];

      // Create order items and assign keys
      for (const item of cartItems) {
        // Get available key
        const { data: keyData, error: keyError } = await supabase
          .from('product_keys')
          .select('id, key_value')
          .eq('product_id', item.product_id)
          .eq('price_tier_id', item.price_tier_id)
          .eq('status', 'available')
          .limit(item.quantity);

        if (keyError) throw keyError;

        for (let i = 0; i < item.quantity; i++) {
          const key = keyData?.[i];
          const keyId = key?.id;
          
          // Create order item
          await supabase.from('order_items').insert({
            order_id: order.id,
            product_id: item.product_id,
            price_tier_id: item.price_tier_id,
            quantity: 1,
            unit_price: item.price_tier.price,
            key_id: keyId,
          });

          // Update key status and collect key info
          if (keyId && key?.key_value) {
            await supabase
              .from('product_keys')
              .update({ status: 'sold', buyer_id: user.id, sold_at: new Date().toISOString() })
              .eq('id', keyId);

            keys.push({
              productName: item.product.name,
              duration: item.price_tier.duration_label,
              keyValue: key.key_value,
            });
          }
        }
      }

      // Deduct balance
      await supabase
        .from('profiles')
        .update({ balance: userBalance - totalAmount })
        .eq('id', user.id);

      // Clear cart
      await clearCart();

      // Show success modal with keys
      setPurchasedKeys(keys);
      setShowSuccessModal(true);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyKey = async (keyValue: string, index: number) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedIndex(index);
      toast({ title: 'Đã sao chép', description: 'Key đã được sao chép vào clipboard' });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể sao chép key', variant: 'destructive' });
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Vui lòng đăng nhập</h1>
          <p className="text-muted-foreground mb-6">
            Bạn cần đăng nhập để thanh toán
          </p>
          <Link to="/auth">
            <Button>Đăng nhập</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Giỏ hàng trống</h1>
          <p className="text-muted-foreground mb-6">
            Vui lòng thêm sản phẩm để thanh toán
          </p>
          <Link to="/">
            <Button>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Tiếp tục mua sắm
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Giỏ hàng <span className="text-muted-foreground font-normal">({cartItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <Card key={`${item.product_id}-${item.price_tier_id}-${index}`} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={item.product.image || '/placeholder.svg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <div>
                          <Link 
                            to={`/product/${item.product_id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.product.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">
                            {formatPrice(item.price_tier.price)}
                          </div>
                          {item.price_tier.original_price && item.price_tier.original_price > item.price_tier.price && (
                            <div className="flex items-center gap-2 justify-end">
                              <Badge variant="destructive" className="text-xs">
                                -{Math.round((1 - item.price_tier.price / item.price_tier.original_price) * 100)}%
                              </Badge>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(item.price_tier.original_price)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <ShoppingBag className="h-4 w-4" />
                            <span>Còn hàng</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                {/* Discount Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                    <span className="text-sm text-foreground">Bạn có mã giới thiệu?</span>
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                    <span className="text-sm text-foreground">Bạn có mã ưu đãi?</span>
                    <Percent className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                    <span className="text-sm text-foreground">Bạn muốn tặng cho bạn bè?</span>
                    <Gift className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-semibold text-foreground mb-3">Thanh toán</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng giá trị sản phẩm</span>
                      <span className="text-foreground">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng giá trị phải thanh toán</span>
                      <span className="text-foreground font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số dư hiện tại</span>
                      <span className={userBalance >= totalAmount ? 'text-green-600' : 'text-foreground'}>{formatPrice(userBalance)}</span>
                    </div>
                    {amountNeeded > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số tiền cần nạp thêm</span>
                        <span className="text-destructive">{formatPrice(amountNeeded)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3 pt-2">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    onClick={handleBalancePayment}
                    disabled={isProcessing || userBalance < totalAmount}
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    {isProcessing ? 'Đang xử lý...' : userBalance >= totalAmount ? 'Thanh toán bằng số dư' : 'Nạp thêm vào tài khoản'}
                  </Button>
                  
                  {userBalance >= totalAmount && (
                    <p className="text-xs text-muted-foreground text-center">
                      Quét mã. Thanh toán. Không cần nạp tiền.
                    </p>
                  )}

                  <Button variant="outline" className="w-full bg-[#1a237e] hover:bg-[#1a237e]/90 text-white border-0" size="lg" disabled>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Mua siêu tốc qua VNPay & Banking
                  </Button>
                  
                  <Button variant="outline" className="w-full bg-[#303f9f] hover:bg-[#303f9f]/90 text-white border-0" size="lg" disabled>
                    <QrCode className="mr-2 h-5 w-5" />
                    Mua siêu tốc qua QR Banking
                  </Button>
                  
                  <Button variant="outline" className="w-full bg-[#d81b60] hover:bg-[#d81b60]/90 text-white border-0" size="lg" disabled>
                    <Smartphone className="mr-2 h-5 w-5" />
                    Thanh toán bằng MoMo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Thanh toán thành công!</h3>
                <p className="text-white/80 text-sm mt-1">Cảm ơn bạn đã mua hàng</p>
              </div>

              {/* Keys List */}
              <div className="p-6 max-h-80 overflow-y-auto">
                <h4 className="font-semibold text-foreground mb-4">Thông tin Key của bạn:</h4>
                <div className="space-y-3">
                  {purchasedKeys.map((key, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-muted rounded-lg border border-border"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground text-sm">{key.productName}</p>
                          <p className="text-xs text-muted-foreground">{key.duration}</p>
                        </div>
                      </div>
                      <div 
                        className="flex items-center gap-2 p-3 bg-background rounded-md border border-border cursor-pointer hover:border-primary transition-colors group"
                        onClick={() => handleCopyKey(key.keyValue, index)}
                      >
                        <code className="flex-1 text-sm font-mono text-foreground break-all">
                          {key.keyValue}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {purchasedKeys.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm">
                      Không có key nào được gán. Vui lòng liên hệ hỗ trợ.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCloseSuccessModal}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
