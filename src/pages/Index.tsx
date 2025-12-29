import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { ProductGrid } from "@/components/products/ProductGrid";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>KeyStore - Key Bản Quyền Phần Mềm & Game Chính Hãng</title>
        <meta
          name="description"
          content="Cung cấp key bản quyền phần mềm, game, tài khoản premium chính hãng với giá tốt nhất. Giao key tự động 24/7, bảo hành uy tín."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <ProductGrid />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
