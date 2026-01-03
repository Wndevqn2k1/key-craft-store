import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProductWithTiers, PriceTier } from '@/types/database';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, 
  ShoppingCart, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Shield,
  Zap,
  Clock,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductWithTiers | null>(null);
  const [selectedTier, setSelectedTier] = useState<PriceTier | null>(null);
  const [keyStock, setKeyStock] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (productError) throw productError;
        if (!productData) {
          setProduct(null);
          return;
        }

        // Fetch price tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('price_tiers')
          .select('*')
          .eq('product_id', id)
          .order('price', { ascending: true });

        if (tiersError) throw tiersError;

        // Fetch product images
        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', id)
          .order('display_order', { ascending: true });

        if (!imagesError && imagesData) {
          setProductImages(imagesData);
        }

        const productWithTiers: ProductWithTiers = {
          ...productData,
          price_tiers: tiersData || [],
        };

        setProduct(productWithTiers);
        
        // Set default selected tier (popular one or first)
        const popularTier = tiersData?.find(t => t.is_popular) || tiersData?.[0];
        if (popularTier) {
          setSelectedTier(popularTier as PriceTier);
        }

        // Fetch key stock counts
        if (tiersData && tiersData.length > 0) {
          const tierIds = tiersData.map(t => t.id);
          const { data: keysData, error: keysError } = await supabase
            .from('product_keys')
            .select('price_tier_id')
            .in('price_tier_id', tierIds)
            .eq('status', 'available');

          if (!keysError && keysData) {
            const stockMap: Record<string, number> = {};
            tierIds.forEach(tierId => {
              stockMap[tierId] = keysData.filter(k => k.price_tier_id === tierId).length;
            });
            setKeyStock(stockMap);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !selectedTier) return;
    
    setIsAddingToCart(true);
    await addToCart(product.id, selectedTier.id);
    setIsAddingToCart(false);
  };

  const handleBuyNow = () => {
    if (!product || !selectedTier) return;
    
    if (!user) {
      toast({ 
        title: 'Vui lòng đăng nhập', 
        description: 'Bạn cần đăng nhập để thanh toán',
        variant: 'destructive' 
      });
      navigate('/auth');
      return;
    }

    navigate('/checkout', {
      state: {
        directItem: {
          product_id: product.id,
          price_tier_id: selectedTier.id,
          quantity: 1,
          product: {
            id: product.id,
            name: product.name,
            image: product.image,
            category: product.category,
          },
          price_tier: {
            id: selectedTier.id,
            duration_label: selectedTier.duration_label,
            price: selectedTier.price,
            original_price: selectedTier.original_price,
          },
        }
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const allImages = [
    ...(product?.image ? [{ id: 'main', image_url: product.image, display_order: -1 }] : []),
    ...productImages
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-video rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sản phẩm không tồn tại</h1>
          <Link to="/">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại trang chủ
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/" className="hover:text-foreground transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative">
              <div className="aspect-video rounded-xl overflow-hidden bg-card border border-border">
                <img
                  src={allImages[currentImageIndex]?.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.badge && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  {product.badge}
                </Badge>
              )}
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all',
                      index === currentImageIndex 
                        ? 'border-primary' 
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.floor(product.rating || 5)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({product.reviews_count || 0} đánh giá)
                  </span>
                </div>
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Tính năng:</h3>
                <ul className="grid gap-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Price Tiers */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Chọn gói:</h3>
              {product.price_tiers.length === 0 ? (
                <p className="text-muted-foreground text-sm">Chưa có gói nào được cấu hình</p>
              ) : (
                <div className="grid gap-3">
                  {product.price_tiers.map((tier) => {
                    const stock = keyStock[tier.id] || 0;
                    const isSelected = selectedTier?.id === tier.id;
                    
                    return (
                      <Card
                        key={tier.id}
                        className={cn(
                          'cursor-pointer transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => setSelectedTier(tier as PriceTier)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                  isSelected ? 'border-primary' : 'border-muted-foreground'
                                )}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {tier.duration_label}
                                  </span>
                                  {tier.is_popular && (
                                    <Badge variant="secondary" className="text-xs">
                                      Phổ biến
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-primary font-bold">
                                    {formatPrice(tier.price)}
                                  </span>
                                  {tier.original_price && tier.original_price > tier.price && (
                                    <span className="text-muted-foreground line-through">
                                      {formatPrice(tier.original_price)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn(
                                'text-sm font-medium',
                                stock > 0 ? 'text-green-500' : 'text-red-500'
                              )}>
                                {stock > 0 ? `Còn ${stock} key` : 'Hết hàng'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                disabled={!selectedTier || (keyStock[selectedTier?.id || ''] || 0) === 0 || isAddingToCart}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!selectedTier || (keyStock[selectedTier?.id || ''] || 0) === 0}
                onClick={handleBuyNow}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Thanh toán ngay
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex flex-col items-center text-center">
                <Shield className="h-6 w-6 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Key chính hãng</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Zap className="h-6 w-6 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Giao ngay</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Clock className="h-6 w-6 text-primary mb-1" />
                <span className="text-xs text-muted-foreground">Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        {product.description && (
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Mô Tả Sản Phẩm</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;