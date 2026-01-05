import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useDepositRealtime } from "@/hooks/useDepositRealtime";
import { 
  Wallet, 
  CreditCard, 
  Building2, 
  Copy, 
  CheckCircle2,
  ArrowRight,
  QrCode,
  Loader2,
  RefreshCw,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const Deposit = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: siteSettings } = useSiteSettings();
  
  // Enable realtime notifications for deposit updates
  useDepositRealtime();
  const [amount, setAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query to check pending deposit status
  const { data: pendingDeposit, refetch: refetchDeposit } = useQuery({
    queryKey: ['pending-deposit', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && hasSubmitted,
    refetchInterval: hasSubmitted ? 10000 : false, // Poll every 10s when submitted
  });

  // Function to manually check VCB transactions
  const checkVCBTransactions = async () => {
    setIsChecking(true);
    try {
      const response = await supabase.functions.invoke('check-vcb-transactions');

      
      if (response.error) {
        toast({
          title: "Lỗi kiểm tra giao dịch!",
          description: `${response.error.message || 'Không thể kết nối đến API'}`,
          variant: "destructive"
        });
        return;
      }
      
      if (response.data?.matchedDeposits > 0) {
        toast({
          title: "Nạp tiền thành công!",
          description: `Đã xác nhận ${response.data.matchedDeposits} giao dịch.`,
        });
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['pending-deposit'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setHasSubmitted(false);
        
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        // Show info about check result
        toast({
          title: "Chưa tìm thấy giao dịch",
          description: `Đã kiểm tra ${response.data?.totalTransactions || 0} giao dịch. Vui lòng đợi thêm hoặc kiểm tra lại thông tin chuyển khoản.`,
        });
      }
      
      setCheckCount(prev => prev + 1);
    } catch (error) {
      console.error('Error checking VCB transactions:', error);
      toast({
        title: "Lỗi!",
        description: "Không thể kiểm tra giao dịch. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Start polling when deposit is submitted
  useEffect(() => {
    if (hasSubmitted && !pollingIntervalRef.current) {
      // Initial check after 30 seconds
      const initialCheck = setTimeout(() => {
        checkVCBTransactions();
      }, 30000);

      // Then check every 60 seconds
      pollingIntervalRef.current = setInterval(() => {
        checkVCBTransactions();
      }, 60000);

      return () => {
        clearTimeout(initialCheck);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [hasSubmitted]);

  // Check if pending deposit was approved
  useEffect(() => {
    if (pendingDeposit === null && hasSubmitted && checkCount > 0) {
      // Deposit was approved
      toast({
        title: "Nạp tiền thành công!",
        description: "Số dư đã được cộng vào tài khoản của bạn.",
      });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      setHasSubmitted(false);
    }
  }, [pendingDeposit, hasSubmitted, checkCount]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast({
      title: "Đã sao chép!",
      description: `${field} đã được sao chép vào clipboard.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const transferContent = `KS${user?.id?.slice(0, 6).toUpperCase() || "STORE"}`;

  const createDepositMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('deposits').insert({
        user_id: user!.id,
        amount,
        payment_method: 'bank_transfer',
        transfer_content: transferContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      toast({
        title: "Đã gửi yêu cầu!",
        description: "Yêu cầu nạp tiền của bạn đang chờ xử lý. Vui lòng chuyển khoản theo thông tin đã cung cấp.",
      });
      setHasSubmitted(true);
    },
    onError: () => {
      toast({
        title: "Lỗi!",
        description: "Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Nạp tiền - GOODTEAM</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Vui lòng đăng nhập</h2>
              <p className="text-muted-foreground mb-4">
                Bạn cần đăng nhập để nạp tiền vào tài khoản
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
        <title>Nạp tiền - GOODTEAM</title>
        <meta
          name="description"
          content="Nạp tiền vào tài khoản KeyStore qua chuyển khoản ngân hàng, VNPay hoặc MoMo."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-6">
                  <Wallet className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Nạp tiền tài khoản</span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-gradient">Nạp tiền vào tài khoản</span>
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Chọn phương thức nạp tiền phù hợp. Tiền sẽ được cộng vào tài khoản sau khi xác nhận.
                </p>
              </div>
            </div>
          </section>

          {/* Amount Selection */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Chọn số tiền nạp
                    </CardTitle>
                    <CardDescription>
                      Chọn mệnh giá có sẵn hoặc nhập số tiền tùy ý
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                      {PRESET_AMOUNTS.map((preset) => (
                        <Button
                          key={preset}
                          variant={amount === preset ? "default" : "outline"}
                          className={amount === preset ? "glow-primary" : ""}
                          onClick={() => {
                            setAmount(preset);
                            setCustomAmount("");
                          }}
                        >
                          {formatAmount(preset)}đ
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="customAmount">Hoặc nhập số tiền khác</Label>
                        <Input
                          id="customAmount"
                          type="number"
                          placeholder="Nhập số tiền..."
                          value={customAmount}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            if (e.target.value) {
                              setAmount(parseInt(e.target.value));
                            }
                          }}
                          min={10000}
                        />
                      </div>
                      <span className="text-muted-foreground pb-2">VNĐ</span>
                    </div>
                    <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Số tiền nạp:</span>
                        <span className="font-display text-2xl font-bold text-primary">
                          {formatAmount(amount)}đ
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="py-8 pb-16">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <Tabs defaultValue="bank" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="bank" className="gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Chuyển khoản</span>
                      <span className="sm:hidden">CK</span>
                    </TabsTrigger>
                    <TabsTrigger value="vietqr" className="gap-2">
                      <QrCode className="w-4 h-4" />
                      VietQR
                    </TabsTrigger>
                    <TabsTrigger value="vnpay" className="gap-2">
                      <CreditCard className="w-4 h-4" />
                      VNPay
                    </TabsTrigger>
                    <TabsTrigger value="momo" className="gap-2">
                      <Wallet className="w-4 h-4" />
                      MoMo
                    </TabsTrigger>
                  </TabsList>

                  {/* Bank Transfer */}
                  <TabsContent value="bank">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          Chuyển khoản ngân hàng
                        </CardTitle>
                        <CardDescription>
                          Chuyển khoản theo thông tin bên dưới. Tiền sẽ được cộng sau 1-5 phút.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          {[
                            { label: "Ngân hàng", value: siteSettings?.bank_name || 'Vietcombank' },
                            { label: "Số tài khoản", value: siteSettings?.bank_account || '1234567890' },
                            { label: "Tên tài khoản", value: siteSettings?.bank_holder || 'KEYSTORE VIETNAM' },
                            { label: "Chi nhánh", value: siteSettings?.bank_branch || 'Chi nhánh Hà Nội' },
                            { label: "Số tiền", value: `${formatAmount(amount)} VNĐ` },
                            { label: "Nội dung CK", value: transferContent },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                            >
                              <div>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                                <p className="font-medium">{item.value}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(item.value, item.label)}
                              >
                                {copied === item.label ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 mb-4">
                          <p className="text-sm text-muted-foreground">
                            <strong className="text-accent">Lưu ý:</strong> Vui lòng nhập đúng nội dung chuyển khoản 
                            để hệ thống xác nhận. Admin sẽ duyệt yêu cầu trong vòng 1-5 phút.
                          </p>
                        </div>

                        {hasSubmitted ? (
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <div className="relative">
                                <Clock className="w-6 h-6 text-primary animate-pulse" />
                              </div>
                              <p className="font-medium text-primary">Đang chờ xác nhận giao dịch...</p>
                            </div>
                            
                            <p className="text-sm text-muted-foreground text-center mb-4">
                              Hệ thống sẽ tự động kiểm tra và cộng tiền khi phát hiện giao dịch của bạn.
                              {checkCount > 0 && (
                                <span className="block mt-1 text-xs">
                                  Đã kiểm tra {checkCount} lần
                                </span>
                              )}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={checkVCBTransactions}
                                disabled={isChecking}
                              >
                                {isChecking ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang kiểm tra...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Kiểm tra ngay
                                  </>
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                className="flex-1"
                                onClick={() => navigate('/profile')}
                              >
                                Xem lịch sử nạp tiền
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            className="w-full glow-primary" 
                            size="lg"
                            onClick={() => createDepositMutation.mutate()}
                            disabled={createDepositMutation.isPending || amount < 10000}
                          >
                            {createDepositMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Xác nhận đã chuyển khoản ({formatAmount(amount)}đ)
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* VietQR */}
                  <TabsContent value="vietqr">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-primary" />
                          Quét mã VietQR
                        </CardTitle>
                        <CardDescription>
                          Quét mã QR bằng app ngân hàng để chuyển khoản nhanh. Thông tin đã được điền sẵn.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col items-center">
                          {/* VietQR Image */}
                          <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                            <img 
                              src={`https://img.vietqr.io/image/${siteSettings?.bank_bin || '970436'}-${siteSettings?.bank_account || '1234567890'}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(siteSettings?.bank_holder || 'KEYSTORE VIETNAM')}`}
                              alt="VietQR Code"
                              className="w-64 h-64 object-contain"
                              onError={(e) => {
                                // Fallback nếu lỗi
                                (e.target as HTMLImageElement).src = `https://img.vietqr.io/image/VCB-${siteSettings?.bank_account || '1234567890'}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}`;
                              }}
                            />
                          </div>
                          
                          <div className="text-center mb-4">
                            <p className="text-muted-foreground text-sm mb-2">
                              Số tiền: <strong className="text-primary text-lg">{formatAmount(amount)}đ</strong>
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Nội dung: <strong className="text-accent">{transferContent}</strong>
                            </p>
                          </div>

                          <div className="w-full max-w-sm space-y-2">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                              <div>
                                <p className="text-sm text-muted-foreground">Ngân hàng</p>
                                <p className="font-medium">{siteSettings?.bank_name || 'Vietcombank'}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                              <div>
                                <p className="text-sm text-muted-foreground">Số tài khoản</p>
                                <p className="font-medium">{siteSettings?.bank_account || '1234567890'}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(siteSettings?.bank_account || '1234567890', 'Số tài khoản')}
                              >
                                {copied === 'Số tài khoản' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                              <div>
                                <p className="text-sm text-muted-foreground">Chủ tài khoản</p>
                                <p className="font-medium">{siteSettings?.bank_holder || 'KEYSTORE VIETNAM'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 mt-4 w-full">
                            <p className="text-sm text-muted-foreground text-center">
                              <strong className="text-accent">Hướng dẫn:</strong> Mở app ngân hàng → Quét mã QR → Xác nhận chuyển khoản
                            </p>
                          </div>

                          {hasSubmitted ? (
                            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mt-4 w-full">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <Clock className="w-6 h-6 text-primary animate-pulse" />
                                <p className="font-medium text-primary">Đang chờ xác nhận...</p>
                              </div>
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={checkVCBTransactions}
                                disabled={isChecking}
                              >
                                {isChecking ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang kiểm tra...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Kiểm tra ngay
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              className="w-full glow-primary mt-4" 
                              size="lg"
                              onClick={() => createDepositMutation.mutate()}
                              disabled={createDepositMutation.isPending || amount < 10000}
                            >
                              {createDepositMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Đang xử lý...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Xác nhận đã chuyển khoản ({formatAmount(amount)}đ)
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* VNPay */}
                  <TabsContent value="vnpay">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-[#0066b3]" />
                          Thanh toán VNPay
                        </CardTitle>
                        <CardDescription>
                          Thanh toán qua cổng VNPay - Hỗ trợ thẻ ATM nội địa, Visa, Mastercard
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center py-8">
                        <div className="w-48 h-48 bg-[#0066b3]/10 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-[#0066b3]/30">
                          <img 
                            src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" 
                            alt="VNPay Logo"
                            className="w-32 h-32 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Số tiền: <strong className="text-primary">{formatAmount(amount)}đ</strong>
                        </p>
                        <Button className="bg-[#0066b3] hover:bg-[#004d8a] gap-2" disabled>
                          Thanh toán với VNPay
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <p className="text-sm text-muted-foreground mt-4">
                          Tính năng đang được phát triển. Vui lòng sử dụng VietQR hoặc chuyển khoản.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* MoMo */}
                  <TabsContent value="momo">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-[#ae2070]" />
                          Thanh toán MoMo
                        </CardTitle>
                        <CardDescription>
                          Thanh toán nhanh qua ví điện tử MoMo
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center py-8">
                        <div className="w-48 h-48 bg-[#ae2070]/10 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-[#ae2070]/30">
                          <Wallet className="w-16 h-16 text-[#ae2070]" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Số tiền: <strong className="text-primary">{formatAmount(amount)}đ</strong>
                        </p>
                        <Button className="bg-[#ae2070] hover:bg-[#8e1a5c] gap-2">
                          Thanh toán với MoMo
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <p className="text-sm text-muted-foreground mt-4">
                          Tính năng đang được phát triển. Vui lòng sử dụng chuyển khoản ngân hàng.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Deposit;
