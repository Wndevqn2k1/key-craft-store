import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Gamepad2, Mail, Lock, User, Loader2, Phone } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email không hợp lệ');
const passwordSchema = z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự');

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Check if coming from email confirmation
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      toast({
        title: 'Xác nhận email thành công! 🎉',
        description: 'Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập để tiếp tục.',
        duration: 5000,
      });
      // Remove query param
      navigate('/auth', { replace: true });
    }
  }, [searchParams, toast, navigate]);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate empty fields
    if (!loginEmail.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập địa chỉ email',
        variant: 'destructive',
      });
      return;
    }

    if (!loginPassword.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập mật khẩu',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Validate email format
    try {
      emailSchema.parse(loginEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Email không hợp lệ',
          description: 'Vui lòng nhập địa chỉ email đúng định dạng (ví dụ: example@email.com)',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    // Validate password length
    try {
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Mật khẩu không hợp lệ',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      let title = 'Đăng nhập thất bại';
      let message = 'Đã xảy ra lỗi khi đăng nhập';
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('invalid_credentials') ||
          error.message.includes('Invalid')) {
        title = 'Thông tin đăng nhập không đúng';
        message = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại thông tin và thử lại.';
      } else if (error.message.includes('Email not confirmed')) {
        title = 'Email chưa được xác nhận';
        message = 'Vui lòng kiểm tra hộp thư email của bạn và xác nhận tài khoản trước khi đăng nhập.';
      } else if (error.message.includes('User not found')) {
        title = 'Tài khoản không tồn tại';
        message = 'Email này chưa được đăng ký. Vui lòng đăng ký tài khoản mới.';
      } else if (error.message.includes('Too many requests')) {
        title = 'Quá nhiều lần thử';
        message = 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ một chút rồi thử lại.';
      } else if (error.message.includes('Network')) {
        title = 'Lỗi kết nối';
        message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.';
      }
      
      toast({
        title,
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng bạn quay lại!',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate empty fields
    if (!registerEmail.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập địa chỉ email',
        variant: 'destructive',
      });
      return;
    }

    if (!registerPassword.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập mật khẩu',
        variant: 'destructive',
      });
      return;
    }

    if (!confirmPassword.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng xác nhận mật khẩu',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Validate email format
    try {
      emailSchema.parse(registerEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Email không hợp lệ',
          description: 'Vui lòng nhập địa chỉ email đúng định dạng (ví dụ: example@email.com)',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    // Validate password length
    try {
      passwordSchema.parse(registerPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Mật khẩu không đủ mạnh',
          description: 'Mật khẩu phải có ít nhất 6 ký tự. Khuyến nghị sử dụng chữ hoa, chữ thường và số.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    // Validate password match
    if (registerPassword !== confirmPassword) {
      toast({
        title: 'Mật khẩu không khớp',
        description: 'Mật khẩu xác nhận không giống với mật khẩu đã nhập. Vui lòng kiểm tra lại.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Validate full name (optional but show warning if empty)
    if (!registerFullName.trim()) {
      toast({
        title: 'Khuyến nghị',
        description: 'Bạn chưa nhập họ tên. Bạn có thể cập nhật sau trong trang hồ sơ.',
        variant: 'default',
      });
    }

    // Validate phone number format (optional)
    if (registerPhone.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(registerPhone.replace(/\s/g, ''))) {
        toast({
          title: 'Số điện thoại không hợp lệ',
          description: 'Số điện thoại phải có 10-11 chữ số (ví dụ: 0912345678)',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signUp(registerEmail, registerPassword, registerFullName, registerPhone);

    if (error) {
      let title = 'Đăng ký thất bại';
      let message = 'Đã xảy ra lỗi khi đăng ký';
      
      // Handle specific error cases
      if (error.message.includes('User already registered') || 
          error.message.includes('already been registered') ||
          error.message.includes('duplicate') ||
          error.message.includes('profiles_email_unique') ||
          error.message.includes('unique constraint')) {
        title = 'Email đã được sử dụng';
        message = 'Email này đã được đăng ký trước đó. Vui lòng đăng nhập hoặc sử dụng email khác.';
      } else if (error.message.includes('profiles_phone_unique') || 
                 error.message.includes('phone') && error.message.includes('unique')) {
        title = 'Số điện thoại đã được sử dụng';
        message = 'Số điện thoại này đã được đăng ký bởi tài khoản khác. Vui lòng sử dụng số điện thoại khác.';
      } else if (error.message.includes('Password should be at least')) {
        title = 'Mật khẩu không hợp lệ';
        message = 'Mật khẩu phải có ít nhất 6 ký tự.';
      } else if (error.message.includes('Invalid email')) {
        title = 'Email không hợp lệ';
        message = 'Định dạng email không đúng. Vui lòng kiểm tra lại.';
      } else if (error.message.includes('Too many requests')) {
        title = 'Quá nhiều lần thử';
        message = 'Bạn đã thử đăng ký quá nhiều lần. Vui lòng chờ một chút rồi thử lại.';
      } else if (error.message.includes('Network')) {
        title = 'Lỗi kết nối';
        message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại.';
      } else if (error.message.includes('rate limit')) {
        title = 'Vượt quá giới hạn';
        message = 'Hệ thống đang bận. Vui lòng thử lại sau vài phút.';
      }
      
      toast({
        title,
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Đăng ký thành công! 🎉',
        description: 'Tài khoản của bạn đã được tạo. Chào mừng đến với GOODTEAM!',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">GOODTEAM</span>
          </div>
          <CardTitle className="text-xl">Chào mừng bạn</CardTitle>
          <CardDescription>Đăng nhập hoặc tạo tài khoản mới</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="register">Đăng ký</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Họ và tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="0912345678"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đăng ký...
                    </>
                  ) : (
                    'Đăng ký'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
