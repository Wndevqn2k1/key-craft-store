import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Zap, Shield, Clock, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  button_text: string | null;
  button_url: string | null;
  image_url: string | null;
  display_order: number;
}

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as Banner[];
    },
  });

  const slidesCount = banners?.length || 1;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slidesCount);
  }, [slidesCount]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount);
  }, [slidesCount]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (slidesCount <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, slidesCount]);

  const currentBanner = banners?.[currentSlide];

  // Default banner content if no banners in database
  const defaultBanner = {
    title: "KEY BẢN QUYỀN CHÍNH HÃNG",
    subtitle: "Giao key tự động 24/7",
    description: "Cung cấp key phần mềm, game, tài khoản premium với giá tốt nhất. Kích hoạt nhanh chóng, bảo hành uy tín, hỗ trợ tận tình.",
    button_text: "Khám phá ngay",
    button_url: "/products",
    image_url: null as string | null,
  };

  const banner = currentBanner || defaultBanner;

  // Parse title to add gradient effect to second part
  const titleParts = banner.title.split(/\n|\\n/);
  const firstLine = titleParts[0] || banner.title;
  const secondLine = titleParts[1] || "";

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Banner background image if exists */}
      {banner.image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${banner.image_url})` }}
        />
      )}
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Navigation Arrows */}
      {slidesCount > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          {banner.subtitle && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{banner.subtitle}</span>
            </div>
          )}

          {/* Title */}
          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="text-foreground">{firstLine}</span>
            {secondLine && (
              <>
                <br />
                <span className="text-gradient">{secondLine}</span>
              </>
            )}
          </h1>

          {/* Description */}
          {banner.description && (
            <p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              {banner.description}
            </p>
          )}

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {banner.button_url?.startsWith("/") ? (
              <Link to={banner.button_url}>
                <Button size="lg" className="font-display text-lg px-8 glow-primary group">
                  {banner.button_text || "Khám phá ngay"}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="font-display text-lg px-8 glow-primary group"
                onClick={() => document.getElementById("featured-products")?.scrollIntoView({ behavior: "smooth" })}
              >
                {banner.button_text || "Khám phá ngay"}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
            <Link to="/deposit">
              <Button
                size="lg"
                variant="outline"
                className="font-display text-lg px-8 hover:border-primary hover:text-primary"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Nạp tiền
              </Button>
            </Link>
          </div>

          {/* Slide Indicators */}
          {slidesCount > 1 && (
            <div className="flex justify-center gap-2 mb-8">
              {banners?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl glass">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Giao hàng tức thì</p>
                <p className="text-sm text-muted-foreground">Nhận key ngay sau thanh toán</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl glass">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Bảo hành uy tín</p>
                <p className="text-sm text-muted-foreground">Cam kết đổi trả 100%</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl glass">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Giá tốt nhất</p>
                <p className="text-sm text-muted-foreground">Rẻ hơn thị trường 20%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
