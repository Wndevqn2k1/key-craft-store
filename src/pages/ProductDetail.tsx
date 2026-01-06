import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsReseller } from '@/hooks/useUserRole';
import { ProductWithTiers, PriceTier } from '@/types/database';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox, useImageLightbox } from '@/components/ui/image-lightbox';
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
  CreditCard,
  Tag
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
  const isReseller = useIsReseller();
  const [product, setProduct] = useState<ProductWithTiers | null>(null);
  const [selectedTier, setSelectedTier] = useState<PriceTier | null>(null);
  const [keyStock, setKeyStock] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Image Lightbox hook
  const { isOpen, currentIndex, openLightbox, closeLightbox} = useImageLightbox();

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
          
          // Direct query to count available keys (secure via RLS)
          const { data: stockData, error: stockError } = await supabase
            .from('product_keys')
            .select('price_tier_id')
            .eq('product_id', productData.id)
            .eq('status', 'available')
            .in('price_tier_id', tierIds);

          if (!stockError && stockData) {
            const stockMap: Record<string, number> = {};
            tierIds.forEach(id => { stockMap[id] = 0; });
            stockData.forEach((item) => {
              stockMap[item.price_tier_id] = (stockMap[item.price_tier_id] || 0) + 1;
            });
            setKeyStock(stockMap);
          } else if (stockError) {
            console.error('Error fetching stock:', stockError);
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

  const handleBuyNow = async () => {
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

    setIsAddingToCart(true);
    await addToCart(product.id, selectedTier.id);
    setIsAddingToCart(false);
    navigate('/checkout');
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative">
              <div 
                className="aspect-video rounded-xl overflow-hidden bg-card border border-border cursor-pointer group"
                onClick={() => openLightbox(currentImageIndex)}
              >
                <img
                  src={allImages[currentImageIndex]?.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 rounded-full p-3">
                      <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{product.name}</h1>
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
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                                  isSelected ? 'border-primary' : 'border-muted-foreground'
                                )}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-foreground text-sm sm:text-base">
                                    {tier.duration_label}
                                  </span>
                                  {tier.is_popular && (
                                    <Badge variant="secondary" className="text-xs">
                                      Phổ biến
                                    </Badge>
                                  )}
                                  {isReseller && tier.reseller_price && (
                                    <div className="flex items-center gap-1">
                                      <Tag className="w-3 h-3 text-green-600" />
                                      <span className="text-xs font-medium text-green-600">Giá Reseller</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-primary font-bold">
                                    {formatPrice(isReseller && tier.reseller_price ? tier.reseller_price : tier.price)}
                                  </span>
                                  {tier.original_price && tier.original_price > (isReseller && tier.reseller_price ? tier.reseller_price : tier.price) && (
                                    <span className="text-muted-foreground line-through">
                                      {formatPrice(tier.original_price)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={cn(
                                'text-xs sm:text-sm font-medium whitespace-nowrap',
                                stock > 0 ? 'text-green-500' : 'text-red-500'
                              )}>
                                {stock > 0 ? `${stock} key` : 'Hết hàng'}
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 w-full sm:w-auto"
                disabled={!selectedTier || (keyStock[selectedTier?.id || ''] || 0) === 0 || isAddingToCart}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </Button>
              <Button
                size="lg"
                className="flex-1 w-full sm:w-auto"
                disabled={!selectedTier || (keyStock[selectedTier?.id || ''] || 0) === 0}
                onClick={handleBuyNow}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Thanh toán ngay
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-border">
              <div className="flex flex-col items-center text-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Key chính hãng</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Giao ngay</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        {product.description && (
          <div className="mt-8 sm:mt-12 border-t border-border pt-6 sm:pt-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Mô Tả Sản Phẩm</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          </div>
        )}
      </main>
      
      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages.map(img => img.image_url)}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={closeLightbox}
      />
      
      <Footer />
    </div>
  );
};

export default ProductDetail;