import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Image, X, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface PriceTierForm {
  id?: string;
  duration: string;
  duration_label: string;
  price: number;
  original_price: number | null;
  is_popular: boolean;
}

interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
  file?: File;
}

const AdminProducts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image: '',
    badge: '',
    features: '',
  });
  const [priceTiers, setPriceTiers] = useState<PriceTierForm[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, price_tiers(*), product_images(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadImage = async (file: File, productId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create product
      const { data: newProduct, error } = await supabase.from('products').insert({
        name: data.name,
        description: data.description,
        category: data.category,
        image: data.image,
        badge: data.badge || null,
        features: data.features ? data.features.split(',').map(f => f.trim()) : [],
      }).select().single();
      
      if (error) throw error;

      // Create price tiers
      if (priceTiers.length > 0) {
        const tiersToInsert = priceTiers.map(tier => ({
          product_id: newProduct.id,
          duration: tier.duration,
          duration_label: tier.duration_label,
          price: tier.price,
          original_price: tier.original_price,
          is_popular: tier.is_popular,
        }));
        
        const { error: tiersError } = await supabase.from('price_tiers').insert(tiersToInsert);
        if (tiersError) throw tiersError;
      }

      // Upload and save images
      if (productImages.length > 0) {
        setUploadingImages(true);
        const imagesToInsert = [];
        
        for (let i = 0; i < productImages.length; i++) {
          const img = productImages[i];
          let imageUrl = img.image_url;
          
          if (img.file) {
            imageUrl = await uploadImage(img.file, newProduct.id);
          }
          
          imagesToInsert.push({
            product_id: newProduct.id,
            image_url: imageUrl,
            display_order: i,
          });
        }
        
        const { error: imgError } = await supabase.from('product_images').insert(imagesToInsert);
        if (imgError) throw imgError;
        setUploadingImages(false);
      }

      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Thành công', description: 'Đã thêm sản phẩm mới' });
    },
    onError: (error) => {
      setUploadingImages(false);
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      // Update product
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description,
          category: data.category,
          image: data.image,
          badge: data.badge || null,
          features: data.features ? data.features.split(',').map(f => f.trim()) : [],
        })
        .eq('id', id);
      if (error) throw error;

      // Delete old price tiers and insert new ones
      await supabase.from('price_tiers').delete().eq('product_id', id);
      
      if (priceTiers.length > 0) {
        const tiersToInsert = priceTiers.map(tier => ({
          product_id: id,
          duration: tier.duration,
          duration_label: tier.duration_label,
          price: tier.price,
          original_price: tier.original_price,
          is_popular: tier.is_popular,
        }));
        
        const { error: tiersError } = await supabase.from('price_tiers').insert(tiersToInsert);
        if (tiersError) throw tiersError;
      }

      // Handle images
      setUploadingImages(true);
      
      // Delete old images
      await supabase.from('product_images').delete().eq('product_id', id);
      
      // Upload new images
      if (productImages.length > 0) {
        const imagesToInsert = [];
        
        for (let i = 0; i < productImages.length; i++) {
          const img = productImages[i];
          let imageUrl = img.image_url;
          
          if (img.file) {
            imageUrl = await uploadImage(img.file, id);
          }
          
          imagesToInsert.push({
            product_id: id,
            image_url: imageUrl,
            display_order: i,
          });
        }
        
        const { error: imgError } = await supabase.from('product_images').insert(imagesToInsert);
        if (imgError) throw imgError;
      }
      
      setUploadingImages(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      toast({ title: 'Thành công', description: 'Đã cập nhật sản phẩm' });
    },
    onError: (error) => {
      setUploadingImages(false);
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Thành công', description: 'Đã xóa sản phẩm' });
    },
    onError: (error) => {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', image: '', badge: '', features: '' });
    setPriceTiers([]);
    setProductImages([]);
    setActiveTab('info');
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      image: product.image || '',
      badge: product.badge || '',
      features: product.features?.join(', ') || '',
    });
    
    // Load price tiers
    setPriceTiers(product.price_tiers?.map((tier: any) => ({
      id: tier.id,
      duration: tier.duration,
      duration_label: tier.duration_label,
      price: tier.price,
      original_price: tier.original_price,
      is_popular: tier.is_popular,
    })) || []);
    
    // Load product images
    setProductImages(product.product_images?.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => ({
      id: img.id,
      image_url: img.image_url,
      display_order: img.display_order,
    })) || []);
    
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addPriceTier = () => {
    setPriceTiers([...priceTiers, {
      duration: '',
      duration_label: '',
      price: 0,
      original_price: null,
      is_popular: false,
    }]);
  };

  const updatePriceTier = (index: number, field: keyof PriceTierForm, value: any) => {
    const updated = [...priceTiers];
    updated[index] = { ...updated[index], [field]: value };
    setPriceTiers(updated);
  };

  const removePriceTier = (index: number) => {
    setPriceTiers(priceTiers.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newImages: ProductImage[] = Array.from(files).map((file, i) => ({
      image_url: URL.createObjectURL(file),
      display_order: productImages.length + i,
      file,
    }));
    
    setProductImages([...productImages, ...newImages]);
  };

  const removeImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="tiers">Phân loại ({priceTiers.length})</TabsTrigger>
                <TabsTrigger value="images">Ảnh ({productImages.length})</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit}>
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">Tên sản phẩm</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Danh mục</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Windows, Office, Antivirus..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">URL hình ảnh chính</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="badge">Badge (Hot, New, Sale...)</Label>
                    <Input
                      id="badge"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="features">Tính năng (cách nhau bởi dấu phẩy)</Label>
                    <Input
                      id="features"
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="Bản quyền vĩnh viễn, Hỗ trợ 24/7..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="tiers" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Thêm các loại key (ví dụ: 1 giờ, 1 ngày, 1 tháng, 1 năm...)
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={addPriceTier}>
                      <Plus className="mr-1 h-4 w-4" /> Thêm loại
                    </Button>
                  </div>
                  
                  {priceTiers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      Chưa có phân loại nào. Nhấn "Thêm loại" để thêm.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {priceTiers.map((tier, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-sm">Loại #{index + 1}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removePriceTier(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Mã thời hạn</Label>
                                <Input
                                  placeholder="1h, 1d, 1m, 1y..."
                                  value={tier.duration}
                                  onChange={(e) => updatePriceTier(index, 'duration', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Tên hiển thị</Label>
                                <Input
                                  placeholder="1 Giờ, 1 Ngày, 1 Tháng..."
                                  value={tier.duration_label}
                                  onChange={(e) => updatePriceTier(index, 'duration_label', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Giá bán (VND)</Label>
                                <Input
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) => updatePriceTier(index, 'price', Number(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Giá gốc (VND)</Label>
                                <Input
                                  type="number"
                                  value={tier.original_price || ''}
                                  placeholder="Để trống nếu không có"
                                  onChange={(e) => updatePriceTier(index, 'original_price', e.target.value ? Number(e.target.value) : null)}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={tier.is_popular}
                                onCheckedChange={(checked) => updatePriceTier(index, 'is_popular', checked)}
                              />
                              <Label className="text-sm">Đánh dấu phổ biến</Label>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4 mt-4">
                  <div>
                    <Label>Ảnh mô tả sản phẩm</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Thêm nhiều ảnh để mô tả chi tiết sản phẩm
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </div>
                  
                  {productImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {productImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img.image_url} 
                            alt={`Product ${index + 1}`}
                            className="w-full aspect-video object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 bg-background/80 px-2 py-0.5 rounded text-xs">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <div className="mt-6">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createMutation.isPending || updateMutation.isPending || uploadingImages}
                  >
                    {uploadingImages ? 'Đang tải ảnh...' : editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Chưa có sản phẩm nào</TableCell>
                </TableRow>
              ) : (
                products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">N/A</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.price_tiers?.slice(0, 2).map((tier: any) => (
                          <Badge key={tier.id} variant="outline" className="text-xs">
                            {tier.duration_label}
                          </Badge>
                        ))}
                        {product.price_tiers?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.price_tiers.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.badge && <Badge variant="secondary">{product.badge}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.in_stock ? 'default' : 'destructive'}>
                        {product.in_stock ? 'Còn hàng' : 'Hết hàng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminProducts;