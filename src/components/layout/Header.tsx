import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, User, X, LogOut, Wallet, Info, Settings, ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { MiniCart } from "@/components/cart/MiniCart";
import { SearchWithAutocomplete } from "@/components/search/SearchWithAutocomplete";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const { user, isAdmin, signOut } = useAuth();
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <span className="text-primary-foreground font-display font-bold text-xl">
                  {settings?.site_name?.charAt(0) || 'K'}
                </span>
              </div>
            )}
            <span className="font-display text-lg md:text-2xl font-bold tracking-wider">
              <span className="text-primary">{settings?.site_name?.split('').slice(0, 3).join('') || 'KEY'}</span>
              <span className="text-foreground">{settings?.site_name?.split('').slice(3).join('') || 'STORE'}</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/products"
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {t('nav.products')}
            </Link>
            <Link
              to="/about"
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              {t('nav.about')}
            </Link>
            <Link
              to="/deposit"
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              Nạp tiền
            </Link>
          </nav>

          {/* Search Bar - Desktop (expanded) */}
          <div className="hidden md:flex items-center flex-1 max-w-2xl mx-6">
            <SearchWithAutocomplete />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
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

            {/* Cart - Now using MiniCart */}
            <MiniCart />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Desktop User Actions - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="w-4 h-4" />
                          {t('nav.admin')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="default" size="sm">
                    {t('nav.login')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Menu Toggle - Mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <SearchWithAutocomplete />
          </div>
        )}

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border/50 pt-4 animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link
                to="/products"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="w-4 h-4" />
                {t('nav.products')}
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Info className="w-4 h-4" />
                {t('nav.about')}
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

              {/* User functions */}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    {t('nav.profile')}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Menu className="w-4 h-4" />
                      {t('nav.admin')}
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
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
