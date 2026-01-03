import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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

  const slidesCount = banners?.length || 0;

  const nextSlide = useCallback(() => {
    if (slidesCount > 0) {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }
  }, [slidesCount]);

  const prevSlide = useCallback(() => {
    if (slidesCount > 0) {
      setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount);
    }
  }, [slidesCount]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (slidesCount <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, slidesCount]);

  // No banners - don't render anything
  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentSlide];

  return (
    <section className="w-full py-4 bg-background">
      {/* Centered Banner Container - 1170x390px */}
      <div className="container mx-auto px-4">
        <div className="relative mx-auto" style={{ maxWidth: '1170px' }}>
          {/* Banner Images */}
          <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '1170/390' }}>
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {banner.button_url ? (
                  <Link to={banner.button_url} className="block w-full h-full">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                        <span className="text-2xl md:text-4xl font-bold text-foreground">
                          {banner.title}
                        </span>
                      </div>
                    )}
                  </Link>
                ) : banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-2xl md:text-4xl font-bold text-foreground">
                      {banner.title}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Dots Indicator - Inside banner at bottom */}
            {slidesCount > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? "bg-primary w-6"
                        : "bg-background/60 hover:bg-background/80"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Navigation Arrows - Outside the banner on sides */}
          {slidesCount > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-[-44px] top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors hidden md:flex items-center justify-center"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-[-44px] top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors hidden md:flex items-center justify-center"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Mobile arrows - inside banner edges */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/60 hover:bg-background/80 transition-colors md:hidden"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-background/60 hover:bg-background/80 transition-colors md:hidden"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
