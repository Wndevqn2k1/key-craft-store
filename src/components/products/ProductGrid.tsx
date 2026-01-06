import { useState } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export function ProductGrid() {
  const { t } = useTranslation();
  const { data: products, isLoading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch categories from database
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  // Filter products by selected category
  const filteredProducts = (() => {
    const list = products ?? [];
    
    // If category selected, filter by it
    const categoryFiltered = selectedCategory 
      ? list.filter((p) => p.category === selectedCategory)
      : list;

    // First, get featured products
    const featured = categoryFiltered.filter((p: any) => p.is_featured === true);
    
    // If we don't have enough featured products, add products with badges
    if (featured.length < 3) {
      const withBadges = categoryFiltered.filter(
        (p: any) => !p.is_featured && p.badge && /hot|top|sale|premium|best|new/i.test(p.badge)
      );
      featured.push(...withBadges.slice(0, 3 - featured.length));
    }
    
    // If still not enough, add remaining products
    if (featured.length < 3) {
      const remaining = categoryFiltered.filter(
        (p: any) => !featured.includes(p)
      );
      featured.push(...remaining.slice(0, 3 - featured.length));
    }
    
    // Sort by display_order (descending), then by created_at (descending)
    const sorted = featured
      .sort((a: any, b: any) => {
        const orderDiff = (a.display_order || 0) - (b.display_order || 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3);
    
    return sorted;
  })();

  return (
    <section id="featured-products" className="py-8 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">{t('home.featuredProducts')}</span>{" "}
            <span className="text-primary text-shadow-glow">{t('home.featuredHighlight')}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.featuredDescription')}
          </p>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="font-medium"
          >
            {t('home.allCategories')}
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.slug ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.slug)}
              className="font-medium"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">{t('product.noProducts')}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap gap-6 justify-center">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] max-w-sm"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

        {products && products.length > 0 && (
          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="outline" size="lg" className="font-display hover:border-primary hover:text-primary">
                {t('home.viewAllProducts')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
