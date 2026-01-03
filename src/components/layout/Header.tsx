import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, Search, User, X, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [balance, setBalance] = useState(0);
  const { user, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setBalance(0);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      if (data) {
        setBalance(data.balance || 0);
      }
    };
    fetchBalance();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <span className="text-primary-foreground font-display font-bold text-xl">K</span>
            </div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-wider">
              <span className="text-primary">KEY</span>
              <span className="text-foreground">STORE</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link to="/products" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              Sản phẩm
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              Giới thiệu
            </Link>
            <Link to="/deposit" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              Nạp tiền
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Balance Display */}
            {user && (
              <Link to="/deposit" className="flex flex-col items-center gap-0.5 px-2 py-1 hover:bg-secondary/50 rounded-lg transition-colors">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-primary">
                  {balance.toLocaleString('vi-VN')}đ
                </span>
              </Link>
            )}

            {/* Cart */}
            <Link to="/checkout">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">Admin</Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}


            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <form onSubmit={handleSearch} className="md:hidden pb-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </form>
        )}

        {isMenuOpen && (
          <nav className="lg:hidden pb-4 border-t border-border/50 pt-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                to="/products"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sản phẩm
              </Link>
              <Link
                to="/about"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Giới thiệu
              </Link>
              <Link
                to="/deposit"
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Nạp tiền
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
