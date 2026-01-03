import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, Search, User, X, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Product {
  id: string;
  name: string;
  image: string | null;
  category: string;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [balance, setBalance] = useState(0);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

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

  // Fetch suggestions when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('id, name, image, category')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(6);

      if (data) {
        setSuggestions(data);
        setShowSuggestions(true);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current && !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    navigate(`/product/${productId}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <span className="text-primary-foreground font-display font-bold text-xl">
                  {settings?.site_name?.charAt(0) || 'K'}
                </span>
              </div>
            )}
            <span className="font-display text-xl md:text-2xl font-bold tracking-wider">
              <span className="text-primary">{settings?.site_name?.split('').slice(0, 3).join('') || 'KEY'}</span>
              <span className="text-foreground">{settings?.site_name?.split('').slice(3).join('') || 'STORE'}</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
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
          <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-10 bg-secondary/50 border-border/50 focus:border-primary"
                />
              </div>
            </form>

            {/* Desktop Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[100] overflow-hidden">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

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

            {/* User - Desktop Only */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
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
              <Link to="/auth" className="hidden md:block">
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
          <div ref={mobileSearchRef} className="md:hidden pb-4 animate-fade-in relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
            </form>

            {/* Mobile Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[100] overflow-hidden">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isMenuOpen && (
          <nav className="lg:hidden pb-4 border-t border-border/50 pt-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link
                to="/products"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="w-4 h-4" />
                Sản phẩm
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Menu className="w-4 h-4" />
                Giới thiệu
              </Link>
              <Link
                to="/deposit"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Wallet className="w-4 h-4" />
                Nạp tiền
              </Link>

              {/* Divider */}
              <div className="h-px bg-border/50 my-2" />

              {/* User functions in mobile menu */}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Tài khoản
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Menu className="w-4 h-4" />
                      Quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Đăng nhập
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
