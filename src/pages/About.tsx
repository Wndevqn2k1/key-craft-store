import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield, Zap, HeadphonesIcon, Award, Users, Clock } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Shield,
      title: "Bảo mật tuyệt đối",
      description: "Tất cả giao dịch được mã hóa và bảo vệ theo tiêu chuẩn cao nhất.",
    },
    {
      icon: Zap,
      title: "Giao hàng tức thì",
      description: "Nhận key ngay lập tức sau khi thanh toán thành công, 24/7 tự động.",
    },
    {
      icon: HeadphonesIcon,
      title: "Hỗ trợ tận tâm",
      description: "Đội ngũ hỗ trợ sẵn sàng giải đáp mọi thắc mắc của bạn.",
    },
    {
      icon: Award,
      title: "Cam kết chất lượng",
      description: "100% key chính hãng, bảo hành đổi key nếu có vấn đề.",
    },
  ];

  const stats = [
    { icon: Users, value: "10,000+", label: "Khách hàng tin tưởng" },
    { icon: Award, value: "50,000+", label: "Key đã bán" },
    { icon: Clock, value: "24/7", label: "Hỗ trợ khách hàng" },
  ];

  return (
    <>
      <Helmet>
        <title>Giới thiệu - KeyStore</title>
        <meta
          name="description"
          content="KeyStore - Đơn vị cung cấp key bản quyền phần mềm, game uy tín hàng đầu Việt Nam."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
            
            <div className="container mx-auto px-4 relative z-10">
              <h1 className="font-display text-4xl md:text-6xl font-bold text-center mb-6">
                Về <span className="text-gradient">KeyStore</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl text-center max-w-3xl mx-auto">
                Chúng tôi là đơn vị tiên phong trong lĩnh vực cung cấp key bản quyền phần mềm, 
                game và tài khoản premium tại Việt Nam với sứ mệnh mang đến trải nghiệm 
                mua sắm đơn giản, an toàn và tiết kiệm nhất cho khách hàng.
              </p>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <stat.icon className="w-8 h-8 text-primary" />
                    </div>
                    <span className="font-display text-4xl font-bold text-primary mb-2">
                      {stat.value}
                    </span>
                    <span className="text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
                Tại sao chọn <span className="text-primary">KeyStore</span>?
              </h2>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                Chúng tôi cam kết mang đến trải nghiệm tốt nhất cho khách hàng
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="group p-6 rounded-xl bg-card border border-border card-hover"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Story Section */}
          <section className="py-20 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-8">
                  Câu chuyện của chúng tôi
                </h2>
                <div className="prose prose-lg prose-invert max-w-none text-center">
                  <p className="text-muted-foreground mb-6">
                    KeyStore được thành lập với mong muốn giúp người dùng Việt Nam tiếp cận 
                    với phần mềm bản quyền một cách dễ dàng và tiết kiệm. Chúng tôi hiểu rằng 
                    việc sử dụng phần mềm bản quyền không chỉ đảm bảo trải nghiệm tốt nhất mà 
                    còn góp phần vào việc bảo vệ quyền sở hữu trí tuệ.
                  </p>
                  <p className="text-muted-foreground mb-6">
                    Với đội ngũ nhân viên tận tâm và hệ thống tự động hiện đại, chúng tôi 
                    tự hào mang đến dịch vụ giao key tức thì 24/7, giúp khách hàng tiết kiệm 
                    thời gian và có thể sử dụng sản phẩm ngay lập tức.
                  </p>
                  <p className="text-muted-foreground">
                    Chúng tôi cam kết tiếp tục đổi mới và nâng cao chất lượng dịch vụ để 
                    xứng đáng với sự tin tưởng của hàng nghìn khách hàng đã đồng hành cùng 
                    KeyStore trong suốt thời gian qua.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
