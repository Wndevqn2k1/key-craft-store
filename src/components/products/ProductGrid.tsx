import { Link } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

export function ProductGrid() {
  const { data: products, isLoading } = useProducts();

  // Sort products by reviews_count (as a proxy for popularity/sales)
  const sortedProducts = products?.slice().sort((a, b) => b.reviews_count - a.reviews_count);

  return (
    <section id="featured-products" className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground">SẢN PHẨM</span>{" "}
            <span className="text-primary text-shadow-glow">NỔI BẬT</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Key bản quyền chính hãng với giá tốt nhất. Giao key tự động 24/7, bảo hành uy tín.
          </p>
        </div>


        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedProducts?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6">
            {sortedProducts?.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-in w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {/* View All */}
        {sortedProducts && sortedProducts.length > 0 && (
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