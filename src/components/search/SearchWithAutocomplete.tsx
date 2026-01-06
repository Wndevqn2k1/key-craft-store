import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { useTranslation } from 'react-i18next';

// Popular searches - có thể lấy từ database sau
const POPULAR_SEARCHES = [
  'hackmap liên quân',
  'hackmap aov',
  'aov đài loan',
  'aov thái lan',
  'tool liên quân',
  'hackmap lmht',
  'key windows',
  'key office',
];

export function SearchWithAutocomplete() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: products } = useProducts();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Filter products based on query
  const suggestions = query.trim()
    ? products
        ?.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5) || []
    : [];

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Navigate to products page with search
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10 pr-10 bg-background"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
          >
            {/* Product Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-3 py-2 flex items-center gap-2">
                  <Search className="w-3 h-3" />
                  Gợi ý sản phẩm
                </div>
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left"
                  >
                    <img
                      src={product.image || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{product.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-2 border-t border-border">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {t('search.recentSearches')}
                  </div>
                  <button
                    onClick={clearRecent}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('common.delete')}
                  </button>
                </div>
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Searches */}
            {!query && (
              <div className="p-2 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground px-3 py-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Tìm kiếm phổ biến
                </div>
                {POPULAR_SEARCHES.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(search)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors text-left"
                  >
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
