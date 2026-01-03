import { ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Giao key tự động 24/7</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">KEY BẢN QUYỀN</span>
            <br />
            <span className="text-gradient">CHÍNH HÃNG</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Cung cấp key phần mềm, game, tài khoản premium với giá tốt nhất. 
            Kích hoạt nhanh chóng, bảo hành uy tín, hỗ trợ tận tình.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg" 
              className="font-display text-lg px-8 glow-primary group"
              onClick={() => document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Khám phá ngay
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="font-display text-lg px-8 hover:border-primary hover:text-primary">
                Liên hệ tư vấn
              </Button>
            </Link>
          </div>

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
