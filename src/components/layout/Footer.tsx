import { Link } from "react-router-dom";
import { Facebook, MessageCircle, Mail, Phone, MapPin, Shield, CreditCard, Clock } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const { data: settings } = useSiteSettings();

  return (
    <footer className="bg-card border-t border-border mt-20">
      {/* Trust Badges */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Bảo mật</p>
                <p className="text-xs text-muted-foreground">100% An toàn</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Thanh toán</p>
                <p className="text-xs text-muted-foreground">Đa dạng hình thức</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Giao key</p>
                <p className="text-xs text-muted-foreground">Tự động 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Hỗ trợ</p>
                <p className="text-xs text-muted-foreground">Tận tình chu đáo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-xl">
                    {settings?.site_name?.charAt(0) || 'K'}
                  </span>
                </div>
              )}
              <span className="font-display text-xl font-bold tracking-wider">
                <span className="text-primary">{settings?.site_name?.split('').slice(0, 3).join('') || 'KEY'}</span>
                <span className="text-foreground">{settings?.site_name?.split('').slice(3).join('') || 'STORE'}</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Cung cấp key bản quyền phần mềm, game chính hãng với giá tốt nhất thị trường.
            </p>
            <div className="flex gap-3">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.zalo_url && (
                <a href={settings.zalo_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-lg">Liên kết</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/deposit" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Nạp tiền
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-lg">Danh mục</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=he-dieu-hanh" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Hệ điều hành
                </Link>
              </li>
              <li>
                <Link to="/products?category=van-phong" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Phần mềm văn phòng
                </Link>
              </li>
              <li>
                <Link to="/products?category=thiet-ke" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Thiết kế
                </Link>
              </li>
              <li>
                <Link to="/products?category=giai-tri" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Giải trí
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-lg">Liên hệ</h3>
            <ul className="space-y-3">
              {settings?.contact_phone && (
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{settings.contact_phone}</span>
                </li>
              )}
              {settings?.contact_email && (
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{settings.contact_email}</span>
                </li>
              )}
              {settings?.contact_address && (
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {settings?.site_name || 'KeyStore'}. {t('footer.allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}
