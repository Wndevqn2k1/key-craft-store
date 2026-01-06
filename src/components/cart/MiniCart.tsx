import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

export function MiniCart() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { cartItems, cartTotal, removeFromCart, isLoading } = useCart();

  const itemCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="relative">
      {/* Cart Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-accent rounded-lg transition-colors"
        aria-label={t('nav.cart')}
      >
        <ShoppingCart className="w-5 h-5" />
        {itemCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Badge className="h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
              {itemCount}
            </Badge>
          </motion.div>
        )}
      </button>

      {/* Mini Cart Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Cart Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-full sm:mt-2 w-auto sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[calc(100vh-5rem)] sm:max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold text-base sm:text-lg">
                  {t('cart.title')} ({itemCount})
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  aria-label={t('common.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    {t('common.loading')}
                  </div>
                ) : cartItems && cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-background rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      {/* Product Image */}
                      <img
                        src={item.product?.image || '/placeholder-product.png'}
                        alt={item.product?.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shrink-0"
                      />

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs sm:text-sm truncate">
                          {item.product?.name}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {item.price_tier?.duration}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-primary font-semibold text-xs sm:text-sm">
                            {formatPrice(item.price_tier?.price || 0)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            x{item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 sm:p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-colors self-start shrink-0"
                        aria-label={t('cart.remove')}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-20" />
                    <p>{t('cart.empty')}</p>
                    <Button
                      variant="link"
                      onClick={() => setIsOpen(false)}
                      asChild
                      className="mt-2"
                    >
                      <Link to="/products">{t('product.allProducts')}</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItems && cartItems.length > 0 && (
                <div className="p-3 sm:p-4 border-t border-border bg-background">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm sm:text-base">{t('cart.total')}:</span>
                    <span className="text-base sm:text-lg font-bold text-primary">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <Button
                    asChild
                    className="w-full"
                    size="lg"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to="/checkout" className="flex items-center justify-center gap-2">
                      {t('cart.checkout')}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
