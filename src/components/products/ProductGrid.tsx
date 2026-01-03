import { Link } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

export function ProductGrid() {
  const { data: products, isLoading } = useProducts();

  // Keep the original ordering from the backend (currently: newest first)
  // Prefer products that have a badge (HOT/TOP SALE/PREMIUM...) like trong ảnh.
  const featuredProducts = (() => {
    const list = products ?? [];
    const preferred = list.filter((p) => !!p.badge && /hot|top|sale|premium|best|new/i.test(p.badge));

    const picked = new Set<string>();
    const result = [] as typeof list;

    for (const p of preferred) {
      if (result.length >= 3) break;
      result.push(p);
      picked.add(p.id);
    }

    for (const p of list) {
      if (result.length >= 3) break;
      if (!picked.has(p.id)) result.push(p);
    }

    return result;
  })();

  return (
    <section id="featured-products" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">SẢN PHẨM</span>{" "}
            <span className="text-primary text-shadow-glow">NỔI BẬT</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Key bản quyền chính hãng với giá tốt nhất. Giao key tự động 24/7, bảo hành uy tín.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in w-full max-w-sm"
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
                Xem tất cả sản phẩm
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
