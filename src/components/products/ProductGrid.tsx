import { useState } from "react";
import { ProductCard } from "./ProductCard";
import { products, categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Grid3X3, Monitor, FileText, Palette, Play, Sparkles } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Grid3X3: <Grid3X3 className="w-4 h-4" />,
  Monitor: <Monitor className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  Play: <Play className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
};

export function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) =>
          p.category.toLowerCase().includes(
            categories.find((c) => c.id === activeCategory)?.name.toLowerCase() || ""
          )
        );

  return (
    <section className="py-16">
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

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${
                activeCategory === category.id
                  ? "glow-primary"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {iconMap[category.icon]}
              {category.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="font-display hover:border-primary hover:text-primary">
            Xem tất cả sản phẩm
          </Button>
        </div>
      </div>
    </section>
  );
}
