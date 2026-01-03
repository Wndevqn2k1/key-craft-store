import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings, useUpdateSiteSettings, SiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Globe, 
  Phone, 
  Image, 
  Building, 
  Save,
  Upload,
  Loader2
} from 'lucide-react';

const AdminSettings = () => {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  
  const [formData, setFormData] = useState<SiteSettings>({
    site_name: '',
    site_title: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    facebook_url: '',
    zalo_url: '',
    bank_name: '',
    bank_account: '',
    bank_holder: '',
    bank_branch: '',
  });
  
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (key: keyof SiteSettings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `site/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      handleInputChange('logo_url', publicUrl);
      toast({ title: 'Thành công', description: 'Đã tải lên logo mới' });
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast({ title: 'Thành công', description: 'Đã lưu cài đặt' });
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cài đặt Website</h1>
            <p className="text-muted-foreground">Quản lý thông tin và giao diện website</p>
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Globe className="mr-2 h-4 w-4" />
              Thông tin chung
            </TabsTrigger>
            <TabsTrigger value="logo">
              <Image className="mr-2 h-4 w-4" />
              Logo & Giao diện
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="mr-2 h-4 w-4" />
              Liên hệ
            </TabsTrigger>
            <TabsTrigger value="bank">
              <Building className="mr-2 h-4 w-4" />
              Ngân hàng
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chung</CardTitle>
                <CardDescription>Cấu hình tên và tiêu đề website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Tên Website</Label>
                    <Input
                      id="site_name"
                      value={formData.site_name}
                      onChange={(e) => handleInputChange('site_name', e.target.value)}
                      placeholder="KEYSTORE"
                    />
                    <p className="text-xs text-muted-foreground">Hiển thị ở header và footer</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_title">Tiêu đề trang (SEO)</Label>
                    <Input
                      id="site_title"
                      value={formData.site_title}
                      onChange={(e) => handleInputChange('site_title', e.target.value)}
                      placeholder="KeyStore - Cửa hàng Key bản quyền"
                    />
                    <p className="text-xs text-muted-foreground">Hiển thị trên tab trình duyệt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logo">
            <Card>
              <CardHeader>
                <CardTitle>Logo Website</CardTitle>
                <CardDescription>Tải lên logo cho website của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="space-y-2">
                    <Label>Logo hiện tại</Label>
                    <div className="w-32 h-32 border border-border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                      {formData.logo_url ? (
                        <img 
                          src={formData.logo_url} 
                          alt="Logo" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-xs text-muted-foreground mt-2">Chưa có logo</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_upload">Tải lên logo mới</Label>
                      <div className="flex gap-2">
                        <Input
                          id="logo_upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploading}
                          className="flex-1"
                        />
                        {isUploading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Khuyến nghị: PNG hoặc SVG, kích thước 200x200px
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Hoặc nhập URL logo</Label>
                      <Input
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => handleInputChange('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
                <CardDescription>Cấu hình thông tin liên hệ hiển thị trên website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="contact@keystore.vn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Số điện thoại</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="0123 456 789"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_address">Địa chỉ</Label>
                  <Textarea
                    id="contact_address"
                    value={formData.contact_address}
                    onChange={(e) => handleInputChange('contact_address', e.target.value)}
                    placeholder="123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <Input
                      id="facebook_url"
                      value={formData.facebook_url}
                      onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                      placeholder="https://facebook.com/keystore"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zalo_url">Zalo</Label>
                    <Input
                      id="zalo_url"
                      value={formData.zalo_url}
                      onChange={(e) => handleInputChange('zalo_url', e.target.value)}
                      placeholder="https://zalo.me/0123456789"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin ngân hàng</CardTitle>
                <CardDescription>Cấu hình thông tin chuyển khoản cho nạp tiền</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Tên ngân hàng</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => handleInputChange('bank_name', e.target.value)}
                      placeholder="Vietcombank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Số tài khoản</Label>
                    <Input
                      id="bank_account"
                      value={formData.bank_account}
                      onChange={(e) => handleInputChange('bank_account', e.target.value)}
                      placeholder="1234567890"
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_holder">Chủ tài khoản</Label>
                    <Input
                      id="bank_holder"
                      value={formData.bank_holder}
                      onChange={(e) => handleInputChange('bank_holder', e.target.value)}
                      placeholder="NGUYEN VAN A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_branch">Chi nhánh</Label>
                    <Input
                      id="bank_branch"
                      value={formData.bank_branch}
                      onChange={(e) => handleInputChange('bank_branch', e.target.value)}
                      placeholder="Chi nhánh Hà Nội"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
