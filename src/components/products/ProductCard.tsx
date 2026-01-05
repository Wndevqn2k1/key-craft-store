import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useCart();
  
  const lowestPrice = product.price_tiers?.length 
    ? Math.min(...product.price_tiers.map((t) => t.price))
    : 0;
  const popularTier = product.price_tiers?.find((t) => t.is_popular) || product.price_tiers?.[0];

  const badgeText = (product.badge ?? "").toLowerCase();
  const badgeClass = badgeText.includes("premium")
    ? "bg-accent text-accent-foreground"
    : badgeText.includes("hot")
      ? "bg-primary text-primary-foreground"
      : badgeText.includes("top") || badgeText.includes("sale") || badgeText.includes("best")
        ? "bg-primary text-primary-foreground"
        : badgeText.includes("new")
          ? "bg-accent text-accent-foreground"
          : "bg-secondary text-secondary-foreground";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group relative bg-card rounded-xl border border-border overflow-hidden card-hover shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      {/* Badge */}
      {product.badge && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
          className="absolute top-3 left-3 z-10"
        >
          <Badge
            className={`font-display font-semibold text-xs px-3 py-1 ${badgeClass}`}
          >
            {product.badge}
          </Badge>
        </motion.div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10">
        <motion.img
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.6 }}
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        
        {/* Quick Actions - Hiện khi hover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 backdrop-blur-sm"
        >
          <Link to={`/product/${product.id}`}>
            <Button size="icon" className="rounded-full bg-background/90 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            size="icon" 
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-110"
            onClick={handleAddToCart}
            disabled={!popularTier}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </motion.div>
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
                {tier.name}
              </span>
            ))}
          </div>
        )}

        {/* Price with Animation */}
        <div className="flex items-end justify-between">
          <div className="overflow-hidden">
            <p className="text-xs text-muted-foreground">Từ</p>
            <motion.p
              whileHover={{ scale: 1.05 }}
              className="font-display font-bold text-xl text-primary"
            >
              {lowestPrice > 0 ? formatPrice(lowestPrice) : 'Liên hệ'}
            </motion.p>
          </div>
          <Link to={`/product/${product.id}`}>
            <Button size="sm" className="glow-primary">
              Xem chi tiết
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
