import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  CreditCard, 
  Building2, 
  Copy, 
  CheckCircle2,
  ArrowRight,
  QrCode
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

const BANK_INFO = {
  bankName: "Vietcombank",
  accountNumber: "1234567890",
  accountName: "KEYSTORE VIETNAM",
  branch: "Chi nhánh Hà Nội",
};

const Deposit = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

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

  const transferContent = `NAP${user?.id?.slice(0, 8).toUpperCase() || "KEYSTORE"}`;

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Nạp tiền - KeyStore</title>
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
        <title>Nạp tiền - KeyStore</title>
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
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="bank" className="gap-2">
                      <Building2 className="w-4 h-4" />
                      Chuyển khoản
                    </TabsTrigger>
                    <TabsTrigger value="vnpay" className="gap-2">
                      <QrCode className="w-4 h-4" />
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
                            { label: "Ngân hàng", value: BANK_INFO.bankName },
                            { label: "Số tài khoản", value: BANK_INFO.accountNumber },
                            { label: "Tên tài khoản", value: BANK_INFO.accountName },
                            { label: "Chi nhánh", value: BANK_INFO.branch },
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

                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                          <p className="text-sm text-muted-foreground">
                            <strong className="text-accent">Lưu ý:</strong> Vui lòng nhập đúng nội dung chuyển khoản 
                            để hệ thống tự động xác nhận. Nếu sau 5 phút chưa nhận được tiền, 
                            vui lòng liên hệ hỗ trợ.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* VNPay */}
                  <TabsContent value="vnpay">
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-primary" />
                          Thanh toán VNPay
                        </CardTitle>
                        <CardDescription>
                          Thanh toán nhanh qua QR code hoặc ứng dụng ngân hàng
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center py-8">
                        <div className="w-48 h-48 bg-secondary/50 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-border">
                          <QrCode className="w-16 h-16 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Số tiền: <strong className="text-primary">{formatAmount(amount)}đ</strong>
                        </p>
                        <Button className="glow-primary gap-2">
                          Thanh toán với VNPay
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                        <p className="text-sm text-muted-foreground mt-4">
                          Tính năng đang được phát triển. Vui lòng sử dụng chuyển khoản ngân hàng.
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
