import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ProductGrid } from "@/components/products/ProductGrid";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>GOODTEAM - Key Bản Quyền Phần Mềm, Game, Hackmap & Tool Chính Hãng</title>
        <meta
          name="description"
          content="Cung cấp key bản quyền phần mềm, game, hackmap LMHT, tool game, cheat, mod chính hãng giá rẻ. Giao key tự động 24/7, bảo hành uy tín, hỗ trợ nhiệt tình."
        />
        <meta
          name="keywords"
          content="key bản quyền, hackmap lol, hackmap lmht, tool game, cheat game, mod game, key windows, key office, phần mềm bản quyền, game tool, key game"
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <AnnouncementBanner />
        <main className="flex-1">
          <HeroSlider />
          <ProductGrid />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
