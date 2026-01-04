-- =============================================
-- GOODGAME KEYSTORE - Complete Database Migration
-- Generated: 2026-01-04
-- =============================================

-- =============================================
-- PART 1: ENUMS
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.key_status AS ENUM ('available', 'sold', 'reserved');
CREATE TYPE public.order_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');

-- =============================================
-- PART 2: TABLES
-- =============================================

-- Categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'Sparkles',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    category TEXT NOT NULL,
    badge TEXT,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Price tiers table
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

-- Product images table
CREATE TABLE public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Product keys table
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

-- Profiles table
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

-- User roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Orders table
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

-- Order items table
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    price_tier_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    key_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Cart items table
CREATE TABLE public.cart_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    price_tier_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Deposits table
CREATE TABLE public.deposits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    status public.deposit_status DEFAULT 'pending',
    payment_method TEXT DEFAULT 'bank_transfer',
    transfer_content TEXT,
    admin_note TEXT,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Announcements table
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

-- Banners table
CREATE TABLE public.banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    button_text TEXT DEFAULT 'Khám phá ngay',
    button_url TEXT DEFAULT '/products',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Site settings table
CREATE TABLE public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- PART 3: FUNCTIONS
-- =============================================

-- Check user role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Assign product keys function
CREATE OR REPLACE FUNCTION public.assign_product_keys(
  p_order_id uuid, 
  p_product_id uuid, 
  p_price_tier_id uuid, 
  p_quantity integer, 
  p_unit_price numeric, 
  p_buyer_id uuid
)
RETURNS TABLE(order_item_id uuid, key_id uuid, key_value text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_order_item_id UUID;
  v_assigned_count INTEGER := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE id = p_order_id 
    AND user_id = p_buyer_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized order access';
  END IF;
  
  FOR v_key_record IN
    SELECT pk.id, pk.key_value
    FROM product_keys pk
    WHERE pk.product_id = p_product_id
      AND pk.price_tier_id = p_price_tier_id
      AND pk.status = 'available'
    ORDER BY pk.created_at
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE product_keys
    SET status = 'sold',
        buyer_id = p_buyer_id,
        sold_at = NOW()
    WHERE id = v_key_record.id;
    
    INSERT INTO order_items (
      order_id,
      product_id,
      price_tier_id,
      quantity,
      unit_price,
      key_id
    ) VALUES (
      p_order_id,
      p_product_id,
      p_price_tier_id,
      1,
      p_unit_price,
      v_key_record.id
    ) RETURNING id INTO v_order_item_id;
    
    v_assigned_count := v_assigned_count + 1;
    
    RETURN QUERY
    SELECT v_order_item_id, v_key_record.id, v_key_record.key_value;
  END LOOP;
  
  IF v_assigned_count < p_quantity THEN
    RAISE EXCEPTION 'Không đủ key khả dụng. Yêu cầu: %, Có sẵn: %', p_quantity, v_assigned_count;
  END IF;
END;
$$;

-- =============================================
-- PART 4: TRIGGERS
-- =============================================

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

CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PART 5: ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Products policies
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Price tiers policies
CREATE POLICY "Anyone can view price tiers" ON public.price_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can insert price tiers" ON public.price_tiers FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update price tiers" ON public.price_tiers FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete price tiers" ON public.price_tiers FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Product images policies
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert product images" ON public.product_images FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON public.product_images FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON public.product_images FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Product keys policies
CREATE POLICY "Admins can view all keys" ON public.product_keys FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their purchased keys" ON public.product_keys FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Admins can insert keys" ON public.product_keys FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update keys" ON public.product_keys FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete keys" ON public.product_keys FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Order items policies
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert order items for their orders" ON public.order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- Cart items policies
CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own cart" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

-- Deposits policies
CREATE POLICY "Users can view their own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON public.deposits FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update deposits" ON public.deposits FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Announcements policies
CREATE POLICY "Anyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all announcements" ON public.announcements FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Banners policies
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all banners" ON public.banners FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Site settings policies
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete site settings" ON public.site_settings FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- PART 6: STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies for product-images
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'));

-- Storage policies for banners
CREATE POLICY "Anyone can view banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admins can upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'));

-- =============================================
-- PART 7: INSERT DATA
-- =============================================

-- Insert categories
INSERT INTO public.categories (id, name, slug, icon, display_order) VALUES 
('eab906a6-532a-45c8-8d25-e44a38c2ae1b', 'Office', 'office', 'FileText', 2),
('200b9d9c-4b83-4050-870b-a37252dc8407', 'TOOL/HACK', 'toolhack', 'Package', 3),
('51421c43-0bed-42cd-8664-2cc66f61e176', 'KEY BẢN QUYỀN', 'keytool', 'Monitor', 1);

-- Insert products
INSERT INTO public.products (id, name, description, image, category, badge, rating, reviews_count, in_stock, features) VALUES 
('2c504192-1632-462b-9609-7e5e93784b2f', 'YouTube Premium + YouTube Music 1 năm - Gia hạn chính chủ', 'Quy trình nhận hàng
Đây là gói gia hạn Youtube chính chủ có thời hạn sử dụng 1 năm.
Sau khi mua hàng bạn sẽ nhận được ngay link invite để tham gia Family Youtube.
Thời gian xử lý: Bạn sẽ nhận được link invite ngay sau khi thanh toán thành công.
Sản phẩm chỉ hỗ trợ kích hoạt và sử dụng tại Việt Nam.
Hướng dẫn kích hoạt Youtube Premium
Tận hưởng giải trí với YouTube Premium và YouTube Music!
Video không quảng cáo
Với YouTube Premium, bạn có thể xem hàng triệu video mà không bị quảng cáo gây gián đoạn trước và trong khi xem video. Video không có quảng cáo được hỗ trợ trên tất cả các thiết bị và nền tảng mà bạn có thể đăng nhập bằng tài khoản Google, kể cả trên TV thông minh/máy chơi trò chơi tương thích và các ứng dụng YouTube, YouTube Music, YouTube Gaming và YouTube Kids dành cho thiết bị di động nếu các ứng dụng này có ở địa điểm của bạn.', 'https://cdn.divineshop.vn/image/catalog/Anh-SP/Youtube/YouTube%20Premium%20Music-1nam-65910.png?hash=1715587226', 'office', 'HOT', 5.0, 0, true, ARRAY['Kích Hoạt Premium']),

('ad987c8d-215e-4ab9-bd78-c68320076f92', 'Windows 10 Professional - CD Key', 'Lưu ý:
- Key kích hoạt bản quyền Window 10 bản Pro.

- Kích hoạt 1 thiết bị máy tính. Theo mainboard của máy.

- Trước khi nhập key thì máy bạn phải cài Win 10 Pro và chưa Crack.

- Chỉ sử dụng trên một máy và một tài khoản Microsoft. Các lần cài win sau tự động active theo main của máy và tài khoản này.', 'https://cdn.divineshop.vn/image/catalog/Anh-SP/Kh%C3%A1c/Windows%2010%20Professional%20CD%20Key-22736.png?hash=1716345943', 'keytool', 'HOT', 5.0, 0, true, ARRAY['Bản Quyền Vĩnh Viễn']),

('79f6d962-4d67-4a71-8311-eb60705bfb78', 'MAPHACK LIÊN QUÂN GOOD AOV', 'Ver GOODAOV SEVER VIETNAM
 👑
Các chức năng :
🟢HackMap,Show CD,Auto mua bán đồ
🟢Aimbot, Bug tầm đánh full tướng, Auto (Flo,Yue,Lau,Tulen,…)
🟢Unlock Full skin 3s không trận ảo, Unlock Nút, thông báo hạ
🟢Auto băng sương, bộc phá, trừng trị, hồi máu.
🟢FULL ESP MINIMAP Cho LiveStream
Join https://t.me/addlist/n4OGSAydui01YzVl
Sắp Tới Có Vượt Link Free Key Ngày', 'https://chungchifree.online/upload/IMG_8860.GIF', 'toolhack', 'TOP SALE', 5.0, 0, true, ARRAY['UNLOCK 4 MẮT 4 CHÂN']);

-- Insert price tiers
INSERT INTO public.price_tiers (id, product_id, duration, duration_label, price, original_price, is_popular) VALUES 
('88668630-ac43-4f77-88a5-4120bc389cf3', 'ad987c8d-215e-4ab9-bd78-c68320076f92', '1y', '1 Năm', 200000.00, 1000000.00, true),
('847141b7-8be3-42b2-8bca-a6c554390b12', 'ad987c8d-215e-4ab9-bd78-c68320076f92', 'vv', 'Vĩnh Viễn', 100000.00, 1200000.00, true),
('a5ccfc62-fb49-4c4c-8b7b-da95350d487d', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1h', '1 GIờ', 10000.00, 15000.00, true),
('8ddec5a1-c589-47d6-a6c3-1d06702739a5', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1m', '1 Tháng', 200000.00, 500000.00, true),
('07adfe60-85b5-489a-b35a-7c3c583e1e33', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1m', '1 Tháng', 200000.00, 500000.00, true),
('96895c2e-4428-4221-bc5b-f43b442d3a17', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1d', '1 Ngày', 20000.00, 30000.00, false),
('dbb356c6-5a12-4219-bc4f-c1178a92aec0', '2c504192-1632-462b-9609-7e5e93784b2f', '3m', '3 Tháng', 500000.00, 1000000.00, false);

-- Insert product images
INSERT INTO public.product_images (id, product_id, image_url, display_order) VALUES 
('3518d069-4b82-4bd7-8b5a-fc6b2f7ae80a', 'ad987c8d-215e-4ab9-bd78-c68320076f92', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/ad987c8d-215e-4ab9-bd78-c68320076f92/1767438701051.png', 0),
('495ee4ca-2205-4ad7-890a-566a991a86b1', '79f6d962-4d67-4a71-8311-eb60705bfb78', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/79f6d962-4d67-4a71-8311-eb60705bfb78/1767441385496.png', 0),
('3d7409d9-8225-40cc-aaba-17abdd29fed9', '79f6d962-4d67-4a71-8311-eb60705bfb78', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/79f6d962-4d67-4a71-8311-eb60705bfb78/1767441387985.png', 1);

-- Insert site settings
INSERT INTO public.site_settings (id, key, value) VALUES 
('e69c5047-b355-4cf8-ab7b-4cdded252cfc', 'site_name', 'GOODGAME'),
('1a2ef20c-1f36-4710-a2e2-302bd82a8369', 'site_title', 'GOODGAME - KEY TOOL ĐỘC QUYỀN'),
('abf511cb-1713-4fcf-9815-1b63e6974ce9', 'logo_url', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/site/logo-1767443825590.png'),
('1098b73d-9782-45b2-9289-2997fbbc899d', 'contact_email', 'phanvanthang2k1@gmail.com'),
('db8473c2-cd74-440f-98d9-d028f4acceba', 'contact_phone', '0702672001'),
('cbbe75fb-a7b3-40fc-b6cf-e1e81f26818e', 'contact_address', 'Đà Nẵng'),
('81a7db0d-7056-40fe-9b55-8aa1fcb8f489', 'facebook_url', ''),
('a9a65a7c-2ac3-4adf-b23d-9ae6bb2cda1f', 'zalo_url', '0702672001'),
('4aeb2044-d24f-4898-b16f-43f90bbbc972', 'bank_name', 'Vietcombank'),
('fb5dfeed-bb3f-48b9-83f1-208154ddf1a8', 'bank_account', '0651000829668'),
('7be39806-70b4-4ff4-9f86-ea8c481819ad', 'bank_holder', 'PHAN VAN THANG'),
('5e4808db-5ed2-43c2-84a0-5cc7178223d5', 'bank_branch', 'Chi Nhanh DA NANG');

-- Insert announcements
INSERT INTO public.announcements (id, title, content, is_active, show_contact_button, contact_button_text, contact_button_url) VALUES 
('96ce4496-0178-4226-b60d-247cde4be108', 'ĐẠI GIẢM GIÁ 50%', 'CÁC BẠN MUA TẤT CẢ HACK LOẠI GAME HIỆN TẠI ĐỀU ĐƯỢC GIẢM GIÁ 50% 
VÀ NẠP TIỀN CỘNG 10% VỚI GIÁ TRỊ TRÊN 100K', true, true, 'Liên hệ', 'https://t.me/goodgamevietnam');

-- Insert banners
INSERT INTO public.banners (id, title, subtitle, description, image_url, button_text, button_url, display_order, is_active) VALUES 
('1f1cb79a-ad6a-4149-a46a-3eaa197320d7', 'KEY BẢN QUYỀN CHÍNH HÃNG', 'Giao key tự động 24/7', 'Cung cấp key phần mềm, game, tài khoản premium với giá tốt nhất. Kích hoạt nhanh chóng, bảo hành uy tín, hỗ trợ tận tình.', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/banners/banner-1767455098393.png', 'Khám phá ngay', '/products', 3, true),
('4214b1fc-3f25-4530-9f63-2b7e50bbf596', 'COMINGSONE', NULL, NULL, 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/banners/banner-1767455373089.png', 'Khám phá ngay', '/products', 1, true),
('6da0de27-6d19-40f6-bdcd-f637ce5ebe88', 'naptien', NULL, NULL, 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/banners/banner-1767456049972.png', 'Khám phá ngay', '/products', 2, true);

-- =============================================
-- PART 8: NOTES
-- =============================================
-- 
-- IMPORTANT: After importing this SQL file:
-- 
-- 1. Update image URLs in site_settings, banners, and product_images
--    to point to your new Supabase storage or external URLs
-- 
-- 2. Create an admin user:
--    - Sign up with email/password
--    - Run: INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
-- 
-- 3. Update .env file in your frontend:
--    VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
--    VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
-- 
-- 4. If using edge functions, copy the supabase/functions folder and redeploy
-- 
-- =============================================
