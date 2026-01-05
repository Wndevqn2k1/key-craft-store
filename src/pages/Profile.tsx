import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Wallet, 
  Key, 
  Lock, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Shield,
  UserCog
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch deposit history
  const { data: deposits, isLoading: depositsLoading } = useQuery({
    queryKey: ['deposits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch order history (purchased keys)
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false});

      if (ordersError) throw ordersError;
      if (!ordersData) return [];

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('id, quantity, unit_price, product_id, price_tier_id, key_id')
            .eq('order_id', order.id);

          const itemsWithDetails = await Promise.all(
            (items || []).map(async (item) => {
              const [productRes, tierRes, keyRes] = await Promise.all([
                supabase.from('products').select('name, image').eq('id', item.product_id).single(),
                supabase.from('price_tiers').select('duration_label').eq('id', item.price_tier_id).single(),
                item.key_id ? supabase.from('product_keys').select('key_value').eq('id', item.key_id).single() : Promise.resolve({ data: null }),
              ]);

              return {
                ...item,
                products: productRes.data,
                price_tiers: tierRes.data,
                product_keys: keyRes.data,
              };
            })
          );

          return {
            ...order,
            order_items: itemsWithDetails,
          };
        })
      );

      return ordersWithItems;
    },
    enabled: !!user?.id,
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Lỗi!",
        description: "Mật khẩu mới không khớp.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Lỗi!",
        description: "Mật khẩu mới phải có ít nhất 6 ký tự.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    // Verify old password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: passwordForm.oldPassword,
    });

    if (signInError) {
      toast({
        title: "Lỗi!",
        description: "Mật khẩu cũ không đúng.",
        variant: "destructive",
      });
      setIsChangingPassword(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });

    if (updateError) {
      toast({
        title: "Lỗi!",
        description: "Không thể đổi mật khẩu. Vui lòng thử lại.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thành công!",
        description: "Mật khẩu đã được thay đổi.",
      });
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }

    setIsChangingPassword(false);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const getDepositStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 gap-1"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Chờ xử lý</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500/20 text-blue-400 gap-1"><CheckCircle2 className="w-3 h-3" /> Đã thanh toán</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 gap-1"><CheckCircle2 className="w-3 h-3" /> Hoàn thành</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Shield className="w-3 h-3" /> Quản trị viên</Badge>;
      case 'reseller':
        return <Badge variant="default" className="gap-1"><UserCog className="w-3 h-3" /> Đại lý</Badge>;
      case 'user':
      default:
        return <Badge variant="secondary" className="gap-1"><User className="w-3 h-3" /> Người dùng</Badge>;
    }
  };

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Hồ sơ - GOODTEAM</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Vui lòng đăng nhập</h2>
              <p className="text-muted-foreground mb-4">
                Bạn cần đăng nhập để xem hồ sơ của mình
              </p>
              <Button onClick={() => navigate("/auth")} className="glow-primary">
                Đăng nhập ngay
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Hồ sơ của tôi - GOODTEAM</title>
        <meta
          name="description"
          content="Quản lý thông tin tài khoản, lịch sử nạp tiền và lịch sử mua hàng."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">
                    {profile?.full_name || user.email}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-muted-foreground">{user.email}</p>
                    {userRole && getRoleBadge(userRole)}
                  </div>
                  <p className="text-primary font-semibold mt-1">
                    Số dư: {formatAmount(profile?.balance || 0)}đ
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="py-8 pb-16">
            <div className="container mx-auto px-4">
              <Tabs defaultValue="deposits" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                  <TabsTrigger value="deposits" className="gap-2">
                    <Wallet className="w-4 h-4" />
                    Nạp tiền
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="gap-2">
                    <Key className="w-4 h-4" />
                    Đơn hàng
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2">
                    <Lock className="w-4 h-4" />
                    Bảo mật
                  </TabsTrigger>
                </TabsList>

                {/* Deposits Tab */}
                <TabsContent value="deposits">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-primary" />
                        Lịch sử nạp tiền
                      </CardTitle>
                      <CardDescription>
                        Xem lại các yêu cầu nạp tiền của bạn
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {depositsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : deposits?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Chưa có yêu cầu nạp tiền nào</p>
                          <Button 
                            variant="link" 
                            onClick={() => navigate('/deposit')}
                            className="mt-2"
                          >
                            Nạp tiền ngay
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deposits?.map((deposit) => (
                            <div
                              key={deposit.id}
                              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
                            >
                              <div>
                                <p className="font-semibold text-primary">
                                  +{formatAmount(deposit.amount)}đ
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(deposit.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                                </p>
                                {deposit.admin_note && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Ghi chú: {deposit.admin_note}
                                  </p>
                                )}
                              </div>
                              {getDepositStatusBadge(deposit.status)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary" />
                        Lịch sử mua hàng
                      </CardTitle>
                      <CardDescription>
                        Xem lại các đơn hàng và key đã mua
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : orders?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Chưa có đơn hàng nào</p>
                          <Button 
                            variant="link" 
                            onClick={() => navigate('/products')}
                            className="mt-2"
                          >
                            Mua sắm ngay
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders?.map((order) => (
                            <div
                              key={order.id}
                              className="p-4 rounded-lg bg-secondary/50 border border-border"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                                  </p>
                                  <p className="font-semibold text-primary">
                                    {formatAmount(order.total_amount)}đ
                                  </p>
                                </div>
                                {getOrderStatusBadge(order.status)}
                              </div>
                              <div className="space-y-2">
                                {order.order_items?.map((item: any) => (
                                  <div 
                                    key={item.id}
                                    className="flex items-center gap-3 p-2 rounded bg-background/50"
                                  >
                                    <img 
                                      src={item.products?.image || '/placeholder.svg'} 
                                      alt={item.products?.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{item.products?.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.price_tiers?.duration_label}
                                      </p>
                                    </div>
                                    {item.product_keys?.key_value && (
                                      <code className="text-xs bg-primary/10 px-2 py-1 rounded font-mono">
                                        {item.product_keys.key_value}
                                      </code>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-display flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Đổi mật khẩu
                      </CardTitle>
                      <CardDescription>
                        Thay đổi mật khẩu đăng nhập của bạn
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
                          <div className="relative">
                            <Input
                              id="oldPassword"
                              type={showOldPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu cũ"
                              value={passwordForm.oldPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                            >
                              {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Mật khẩu mới</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Nhập lại mật khẩu mới"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="glow-primary"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Đổi mật khẩu
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Profile;
