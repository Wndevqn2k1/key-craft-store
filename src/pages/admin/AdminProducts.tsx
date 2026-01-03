import React, { useState, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Image, X, GripVertical, Link, Upload, ZoomIn } from 'lucide-react';
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
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [mainImageUrlInput, setMainImageUrlInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);

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

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
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
      let mainImageUrl = data.image;
      
      // Upload main image if file is provided
      if (mainImageFile) {
        const tempId = crypto.randomUUID();
        mainImageUrl = await uploadImage(mainImageFile, tempId);
      }
      
      // Create product
      const { data: newProduct, error } = await supabase.from('products').insert({
        name: data.name,
        description: data.description,
        category: data.category,
        image: mainImageUrl,
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
      let mainImageUrl = data.image;
      
      // Upload main image if file is provided
      if (mainImageFile) {
        mainImageUrl = await uploadImage(mainImageFile, id);
      }
      
      // Update product
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description,
          category: data.category,
          image: mainImageUrl,
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
    setMainImageFile(null);
    setMainImageUrlInput('');
    setImageUrlInput('');
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
    e.target.value = ''; // Reset input
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    
    const newImage: ProductImage = {
      image_url: imageUrlInput.trim(),
      display_order: productImages.length,
    };
    
    setProductImages([...productImages, newImage]);
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newImages = [...productImages];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    
    // Update display order
    const reordered = newImages.map((img, i) => ({ ...img, display_order: i }));
    setProductImages(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Main image handlers
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setMainImageFile(file);
    setFormData({ ...formData, image: URL.createObjectURL(file) });
    e.target.value = '';
  };

  const handleMainImageUrl = () => {
    if (!mainImageUrlInput.trim()) return;
    setFormData({ ...formData, image: mainImageUrlInput.trim() });
    setMainImageFile(null);
    setMainImageUrlInput('');
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
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label>Hình ảnh chính</Label>
                    <div className="space-y-3 mt-2">
                      {/* Preview current image */}
                      {formData.image && (
                        <div className="relative w-32 h-32 group">
                          <img 
                            src={formData.image} 
                            alt="Main" 
                            className="w-full h-full object-cover rounded-lg border cursor-pointer"
                            onClick={() => setPreviewImage(formData.image)}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setFormData({ ...formData, image: '' });
                              setMainImageFile(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 right-1 bg-background/80 px-2 py-0.5 rounded text-xs text-center truncate">
                            Ảnh chính
                          </div>
                        </div>
                      )}
                      
                      {/* URL input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập URL ảnh chính..."
                          value={mainImageUrlInput}
                          onChange={(e) => setMainImageUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleMainImageUrl();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={handleMainImageUrl}>
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* File upload */}
                      <div className="flex gap-2">
                        <Input
                          ref={mainImageInputRef}
                          type="file"
                          accept="image/png,image/gif,image/jpeg,image/jpg,image/webp"
                          onChange={handleMainImageUpload}
                          className="hidden"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => mainImageInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload ảnh chính
                        </Button>
                      </div>
                    </div>
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
                  <div className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Link className="h-4 w-4" />
                        Thêm ảnh bằng URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập URL ảnh (PNG, GIF, JPG...)"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageUrl();
                            }
                          }}
                        />
                        <Button type="button" variant="outline" onClick={handleAddImageUrl}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">hoặc</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Upload className="h-4 w-4" />
                        Upload file ảnh
                      </Label>
                      <Input
                        type="file"
                        accept="image/png,image/gif,image/jpeg,image/jpg,image/webp"
                        multiple
                        onChange={handleImageUpload}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Hỗ trợ: PNG, GIF, JPG, WEBP
                      </p>
                    </div>
                  </div>
                  
                  {productImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Kéo thả để sắp xếp thứ tự. Click vào ảnh để xem lớn hơn.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {productImages.map((img, index) => (
                          <div 
                            key={index} 
                            className={`relative group cursor-move ${draggedIndex === index ? 'opacity-50' : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="absolute top-1 left-1 z-10 bg-background/80 p-1 rounded cursor-grab">
                              <GripVertical className="h-3 w-3" />
                            </div>
                            <img 
                              src={img.image_url} 
                              alt={`Product ${index + 1}`}
                              className="w-full aspect-video object-cover rounded-lg border hover:ring-2 hover:ring-primary transition-all"
                              onClick={() => setPreviewImage(img.image_url)}
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="absolute top-1 right-8 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setPreviewImage(img.image_url)}
                            >
                              <ZoomIn className="h-3 w-3" />
                            </Button>
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
      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <img 
            src={previewImage || ''} 
            alt="Preview" 
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminProducts;