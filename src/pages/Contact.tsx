import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Gửi thành công!",
      description: "Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "support@keystore.vn",
      description: "Gửi email cho chúng tôi",
    },
    {
      icon: Phone,
      title: "Hotline",
      value: "1900 xxxx",
      description: "Hỗ trợ 24/7",
    },
    {
      icon: MapPin,
      title: "Địa chỉ",
      value: "Hà Nội, Việt Nam",
      description: "Trụ sở chính",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      value: "Chat ngay",
      description: "Trả lời trong 5 phút",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Liên hệ - KeyStore</title>
        <meta
          name="description"
          content="Liên hệ với KeyStore để được hỗ trợ về key bản quyền phần mềm, game và các dịch vụ khác."
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
                <span className="text-gradient">Liên hệ với chúng tôi</span>
              </h1>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ với chúng tôi qua các kênh bên dưới 
                hoặc gửi tin nhắn trực tiếp.
              </p>
            </div>
          </section>

          {/* Contact Info Cards */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {contactInfo.map((item, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-xl bg-card border border-border card-hover text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-1">
                      {item.title}
                    </h3>
                    <p className="text-primary font-medium mb-1">{item.value}</p>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto">
                <div className="bg-card rounded-2xl border border-border p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Send className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold">Gửi tin nhắn</h2>
                      <p className="text-muted-foreground text-sm">
                        Điền form bên dưới, chúng tôi sẽ phản hồi sớm nhất
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input
                          id="name"
                          placeholder="Nhập họ và tên"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Nhập email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Tiêu đề</Label>
                      <Input
                        id="subject"
                        placeholder="Nhập tiêu đề"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nội dung</Label>
                      <Textarea
                        id="message"
                        placeholder="Nhập nội dung tin nhắn..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full glow-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Đang gửi..."
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Gửi tin nhắn
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Response Time */}
                <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>Thời gian phản hồi trung bình: 1-2 giờ trong giờ làm việc</span>
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

export default Contact;
