import { Link } from "react-router-dom";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  
  const lowestPrice = product.price_tiers?.length 
    ? Math.min(...product.price_tiers.map((t) => t.price))
    : 0;
  const popularTier = product.price_tiers?.find((t) => t.is_popular) || product.price_tiers?.[0];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (popularTier) {
      addToCart(product.id, popularTier.id);
    }
  };

  return (
    <div className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover">
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-3 left-3 z-10">
          <Badge
            className={`
              font-display font-semibold text-xs px-3 py-1
              ${product.badge === "Hot" ? "bg-destructive text-destructive-foreground" : ""}
              ${product.badge === "Best Seller" ? "bg-primary text-primary-foreground" : ""}
              ${product.badge === "Premium" ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black" : ""}
              ${product.badge === "New" ? "bg-accent text-accent-foreground" : ""}
              ${product.badge === "Popular" ? "bg-cyber text-white" : ""}
              ${product.badge === "Trending" ? "bg-gradient-to-r from-primary to-accent text-black" : ""}
            `}
          >
            {product.badge}
          </Badge>
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        
        {/* Quick Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link to={`/product/${product.id}`}>
            <Button size="icon" className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            size="icon" 
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleAddToCart}
            disabled={!popularTier}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>

        {/* Title */}
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="text-sm font-medium">{product.rating || 5}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews_count || 0} đánh giá)</span>
        </div>

        {/* Price Tiers Preview */}
        {product.price_tiers && product.price_tiers.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.price_tiers.slice(0, 3).map((tier) => (
              <span
                key={tier.id}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  tier.is_popular
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {tier.duration_label}
              </span>
            ))}
            {product.price_tiers.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                +{product.price_tiers.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Từ</p>
            <p className="font-display font-bold text-xl text-primary">
              {lowestPrice > 0 ? formatPrice(lowestPrice) : 'Liên hệ'}
            </p>
          </div>
          <Link to={`/product/${product.id}`}>
            <Button size="sm" className="glow-primary">
              Xem chi tiết
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
