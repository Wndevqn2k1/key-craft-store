-- =====================================================
-- DATABASE EXPORT - GOODGAME KEYSTORE
-- Generated: 2026-01-03
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.key_status AS ENUM ('available', 'sold', 'expired');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'completed', 'cancelled');

-- =====================================================
-- TABLES
-- =====================================================

-- Categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'Sparkles',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image TEXT,
  badge TEXT,
  features TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price Tiers
CREATE TABLE public.price_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  duration TEXT NOT NULL,
  duration_label TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product Images
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product Keys
CREATE TABLE public.product_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_tier_id UUID NOT NULL REFERENCES public.price_tiers(id) ON DELETE CASCADE,
  key_value TEXT NOT NULL,
  status public.key_status DEFAULT 'available',
  buyer_id UUID,
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL,
  status public.order_status DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  price_tier_id UUID NOT NULL REFERENCES public.price_tiers(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  key_id UUID REFERENCES public.product_keys(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cart Items
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_tier_id UUID NOT NULL REFERENCES public.price_tiers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Deposits
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status public.deposit_status NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  transfer_content TEXT,
  admin_note TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  show_contact_button BOOLEAN DEFAULT false,
  contact_button_text TEXT DEFAULT 'Liên hệ',
  contact_button_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Site Settings
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- DATA - Categories
-- =====================================================
INSERT INTO public.categories (id, name, slug, icon, display_order) VALUES
('51421c43-0bed-42cd-8664-2cc66f61e176', 'Windows', 'windows', 'Monitor', 1),
('eab906a6-532a-45c8-8d25-e44a38c2ae1b', 'Office', 'office', 'FileText', 2),
('200b9d9c-4b83-4050-870b-a37252dc8407', 'TOOL/HACK', 'software', 'Sparkles', 3);

-- =====================================================
-- DATA - Products
-- =====================================================
INSERT INTO public.products (id, name, description, category, image, badge, features, rating, reviews_count, in_stock) VALUES
('ad987c8d-215e-4ab9-bd78-c68320076f92', 'Windows 10 Professional - CD Key', 'Lưu ý:
- Key kích hoạt bản quyền Window 10 bản Pro.

- Kích hoạt 1 thiết bị máy tính. Theo mainboard của máy.

- Trước khi nhập key thì máy bạn phải cài Win 10 Pro và chưa Crack.

- Chỉ sử dụng trên một máy và một tài khoản Microsoft. Các lần cài win sau tự động active theo main của máy và tài khoản này.', 'windows', 'https://cdn.divineshop.vn/image/catalog/Anh-SP/Kh%C3%A1c/Windows%2010%20Professional%20CD%20Key-22736.png?hash=1716345943', 'HOT', ARRAY['Bản Quyền Vĩnh Viễn'], 5.0, 0, true),

('79f6d962-4d67-4a71-8311-eb60705bfb78', 'MAPHACK LIÊN QUÂN GOOD AOV', 'Ver GOODAOV SEVER VIETNAM
 👑
Các chức năng :
🟢HackMap,Show CD,Auto mua bán đồ
🟢Aimbot, Bug tầm đánh full tướng, Auto (Flo,Yue,Lau,Tulen,…)
🟢Unlock Full skin 3s không trận ảo, Unlock Nút, thông báo hạ
🟢Auto băng sương, bộc phá, trừng trị, hồi máu.
🟢FULL ESP MINIMAP Cho LiveStream
Join https://t.me/addlist/n4OGSAydui01YzVl
Sắp Tới Có Vượt Link Free Key Ngày', 'software', 'https://chungchifree.online/upload/IMG_8860.GIF', 'TOP SALE', ARRAY['UNLOCK 4 MẮT 4 CHÂN'], 5.0, 0, true),

('2c504192-1632-462b-9609-7e5e93784b2f', 'YouTube Premium + YouTube Music 1 năm - Gia hạn chính chủ', 'Quy trình nhận hàng
Đây là gói gia hạn Youtube chính chủ có thời hạn sử dụng 1 năm.
Sau khi mua hàng bạn sẽ nhận được ngay link invite để tham gia Family Youtube.
Thời gian xử lý: Bạn sẽ nhận được link invite ngay sau khi thanh toán thành công.
Sản phẩm chỉ hỗ trợ kích hoạt và sử dụng tại Việt Nam.
Hướng dẫn kích hoạt Youtube Premium
Tận hưởng giải trí với YouTube Premium và YouTube Music!
Video không quảng cáo
Với YouTube Premium, bạn có thể xem hàng triệu video mà không bị quảng cáo gây gián đoạn trước và trong khi xem video. Video không có quảng cáo được hỗ trợ trên tất cả các thiết bị và nền tảng mà bạn có thể đăng nhập bằng tài khoản Google, kể cả trên TV thông minh/máy chơi trò chơi tương thích và các ứng dụng YouTube, YouTube Music, YouTube Gaming và YouTube Kids dành cho thiết bị di động nếu các ứng dụng này có ở địa điểm của bạn.', 'office', 'https://cdn.divineshop.vn/image/catalog/Anh-SP/Youtube/YouTube%20Premium%20Music-1nam-65910.png?hash=1715587226', 'HOT', ARRAY['Kích Hoạt Premium'], 5.0, 0, true);

-- =====================================================
-- DATA - Price Tiers
-- =====================================================
INSERT INTO public.price_tiers (id, product_id, duration, duration_label, price, original_price, is_popular) VALUES
('88668630-ac43-4f77-88a5-4120bc389cf3', 'ad987c8d-215e-4ab9-bd78-c68320076f92', '1y', '1 Năm', 200000.00, 1000000.00, true),
('a5ccfc62-fb49-4c4c-8b7b-da95350d487d', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1h', '1 GIờ', 10000.00, 30000.00, true),
('c5caf0fe-ad5d-4fae-8b67-53ccf38ca316', '79f6d962-4d67-4a71-8311-eb60705bfb78', '7w', '7 Ngày', 14000.00, 30000.00, false),
('8ddec5a1-c589-47d6-a6c3-1d06702739a5', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1m', '1 Tháng', 200000.00, 500000.00, true),
('f60e8a49-2b57-43ec-96d3-59112c878df3', '2c504192-1632-462b-9609-7e5e93784b2f', '1m', '1 Tháng', 20000.00, 500000.00, true),
('041658ff-bd8d-462b-b0f4-49b3f852845e', '2c504192-1632-462b-9609-7e5e93784b2f', '3m', '3 Tháng', 500000.00, 1000000.00, false);

-- =====================================================
-- DATA - Product Images
-- =====================================================
INSERT INTO public.product_images (id, product_id, image_url, display_order) VALUES
('b9491ff2-8b7b-40e0-ae97-dba26ee668f9', 'ad987c8d-215e-4ab9-bd78-c68320076f92', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/ad987c8d-215e-4ab9-bd78-c68320076f92/1767438701051.png', 0),
('d06a6f9b-b490-4ed8-b2e0-293ad3d521ba', '79f6d962-4d67-4a71-8311-eb60705bfb78', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/79f6d962-4d67-4a71-8311-eb60705bfb78/1767441385496.png', 0),
('f8bc7b2a-16bb-43d3-8441-6c19b4c67d56', '79f6d962-4d67-4a71-8311-eb60705bfb78', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/79f6d962-4d67-4a71-8311-eb60705bfb78/1767441387985.png', 1);

-- =====================================================
-- DATA - Announcements
-- =====================================================
INSERT INTO public.announcements (id, title, content, is_active, show_contact_button, contact_button_text, contact_button_url) VALUES
('96ce4496-0178-4226-b60d-247cde4be108', 'ĐẠI GIẢM GIÁ 50%', 'CÁC BẠN MUA TẤT CẢ HACK LOẠI GAME HIỆN TẠI ĐỀU ĐƯỢC GIẢM GIÁ 50% 
VÀ NẠP TIỀN CỘNG 10% VỚI GIÁ TRỊ TRÊN 100K', true, true, 'Liên hệ', 'https://t.me/goodgamevietnam');

-- =====================================================
-- DATA - Site Settings
-- =====================================================
INSERT INTO public.site_settings (key, value) VALUES
('site_name', 'GOODGAME'),
('site_title', 'GOODGAME - KEY TOOL ĐỘC QUYỀN'),
('logo_url', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/site/logo-1767443825590.png'),
('contact_email', 'phanvanthang2k1@gmail.com'),
('contact_phone', '0702672001'),
('contact_address', 'Đà Nẵng'),
('facebook_url', ''),
('zalo_url', '0702672001'),
('bank_name', 'Vietcombank'),
('bank_account', '9002672001'),
('bank_holder', 'PHAN VAN THANG'),
('bank_branch', 'Chi Nhanh DA NANG');

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- END OF EXPORT
-- =====================================================
