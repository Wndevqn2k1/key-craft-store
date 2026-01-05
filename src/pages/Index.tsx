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
        <title>Mua Key Bản Quyền, Hackmap LMHT, Liên Quân, AOV Giá Rẻ - GOODTEAM</title>
        <meta
          name="description"
          content="🔥 Bán key hackmap LMHT, Liên Quân Mobile, AOV Đài Loan/Thái Lan giá rẻ nhất ⚡ Giao key tự động 24/7 ✅ Hỗ trợ: Hackmap LOL Skin, Tool Liên Quân Auto, Cheat AOV Tướng/Skin, Mod Garena, Key Windows/Office bản quyền. Thanh toán dễ dàng, bảo hành uy tín!"
        />
        <meta
          name="keywords"
          content="mua key, hackmap lmht, hackmap lol, hackmap liên quân, hackmap aov, aov đài loan, aov thái lan, tool liên quân mobile, cheat aov, mod liên quân, tool garena, auto farm liên quân, cheat game mobile, hackmap skin aov, tool auto aov, key windows, key office, mua hackmap, tool hack lol"
        />
        <link rel="canonical" href="https://muahackvip.com/" />
        <meta property="og:url" content="https://muahackvip.com/" />
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
