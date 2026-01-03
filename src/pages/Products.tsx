import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/products/ProductCard";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";

const Products = () => {
  const { data: products, isLoading } = useProducts();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Sync search query from URL params
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Group products by category
  const groupedProducts = products?.reduce((acc, product) => {
    const category = product.category || "Khác";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  // Filter products by search query
  const filteredGroupedProducts = groupedProducts
    ? Object.entries(groupedProducts).reduce((acc, [category, categoryProducts]) => {
        const filtered = categoryProducts?.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered && filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, typeof products>)
    : {};

  return (
    <>
      <Helmet>
        <title>Sản phẩm - KeyStore</title>
        <meta
          name="description"
          content="Khám phá các sản phẩm key bản quyền phần mềm, game, tài khoản premium chính hãng với giá tốt nhất."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="container mx-auto px-4 relative z-10">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-center mb-4">
                <span className="text-gradient">Tất cả sản phẩm</span>
              </h1>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
                Khám phá bộ sưu tập key bản quyền phần mềm, game và tài khoản premium với giá tốt nhất
              </p>

              {/* Search Bar */}
              <div className="max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm theo tên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-card border-border/50 focus:border-primary text-lg"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Products by Category */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : Object.keys(filteredGroupedProducts).length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào"}
                  </p>
                </div>
              ) : (
                Object.entries(filteredGroupedProducts).map(([category, categoryProducts]) => (
                  <div key={category} className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="font-display text-2xl font-bold text-foreground">
                        {category}
                      </h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                      <span className="text-sm text-muted-foreground">
                        {categoryProducts?.length} sản phẩm
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {categoryProducts?.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Products;
