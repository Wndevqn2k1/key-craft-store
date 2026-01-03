import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Copy, 
  Check, 
  ShoppingBag, 
  History,
  Package,
  Calendar,
  CreditCard
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product: {
    name: string;
    image: string | null;
  };
  price_tier: {
    duration_label: string;
  };
  product_key: {
    key_value: string;
  } | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const OrderSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user || !orderId) return;

      try {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (orderError) throw orderError;
        if (!orderData) {
          navigate('/profile');
          return;
        }

        setOrder(orderData);

        // Fetch order items with product and key info
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            quantity,
            unit_price,
            product:products(name, image),
            price_tier:price_tiers(duration_label),
            product_key:product_keys(key_value)
          `)
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;
        setOrderItems(itemsData as unknown as OrderItem[]);
      } catch (error: any) {
        toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [user, orderId, navigate, toast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'balance': return 'Số dư tài khoản';
      case 'vnpay': return 'VNPay';
      case 'momo': return 'MoMo';
      default: return method || 'Không xác định';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Vui lòng đăng nhập</h1>
          <Link to="/auth">
            <Button>Đăng nhập</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mx-auto mb-6" />
          <Skeleton className="h-96 max-w-2xl mx-auto" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Không tìm thấy đơn hàng</h1>
          <Link to="/profile">
            <Button>Xem lịch sử đơn hàng</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Thanh toán thành công - KeyStore</title>
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Thanh toán thành công!</h1>
            <p className="text-muted-foreground">Cảm ơn bạn đã mua hàng tại KeyStore</p>
          </div>

          {/* Order Info */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Thông tin đơn hàng
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mã đơn hàng:</span>
                  <p className="font-mono text-foreground">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Ngày đặt:
                  </span>
                  <p className="text-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Phương thức:
                  </span>
                  <p className="text-foreground">{getPaymentMethodLabel(order.payment_method)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tổng tiền:</span>
                  <p className="font-bold text-primary">{formatPrice(order.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keys List */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-semibold text-foreground mb-4">Thông tin Key của bạn</h2>
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div 
                    key={item.id}
                    className="p-4 bg-muted rounded-lg border border-border"
                  >
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-12 rounded overflow-hidden bg-background shrink-0">
                        <img
                          src={item.product?.image || '/placeholder.svg'}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm line-clamp-1">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.price_tier?.duration_label}</p>
                        <p className="text-sm font-medium text-primary">{formatPrice(item.unit_price)}</p>
                      </div>
                    </div>
                    
                    {item.product_key?.key_value ? (
                      <div 
                        className="flex items-center gap-2 p-3 bg-background rounded-md border border-border cursor-pointer hover:border-primary transition-colors group"
                        onClick={() => handleCopyKey(item.product_key!.key_value, index)}
                      >
                        <code className="flex-1 text-sm font-mono text-foreground break-all">
                          {item.product_key.key_value}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Key chưa được gán. Vui lòng liên hệ hỗ trợ.
                      </p>
                    )}
                  </div>
                ))}

                {orderItems.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Không có sản phẩm nào trong đơn hàng.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1" 
              size="lg"
              onClick={() => navigate('/')}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Tiếp tục mua sắm
            </Button>
            <Button 
              variant="outline"
              className="flex-1" 
              size="lg"
              onClick={() => navigate('/profile')}
            >
              <History className="mr-2 h-4 w-4" />
              Lịch sử đơn hàng
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
