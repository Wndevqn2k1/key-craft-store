-- =============================================
-- GOODGAME KEYSTORE - Data Only Import
-- =============================================

-- Insert categories
INSERT INTO public.categories (id, name, slug, icon, display_order) VALUES 
('eab906a6-532a-45c8-8d25-e44a38c2ae1b', 'Office', 'office', 'FileText', 2),
('200b9d9c-4b83-4050-870b-a37252dc8407', 'TOOL/HACK', 'toolhack', 'Package', 3),
('51421c43-0bed-42cd-8664-2cc66f61e176', 'KEY BẢN QUYỀN', 'keytool', 'Monitor', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO public.products (id, name, description, image, category, badge, rating, reviews_count, in_stock, features) VALUES 
('2c504192-1632-462b-9609-7e5e93784b2f', 'YouTube Premium + YouTube Music 1 năm - Gia hạn chính chủ', 'Quy trình nhận hàng
Đây là gói gia hạn Youtube chính chủ có thời hạn sử dụng 1 năm.
Sau khi mua hàng bạn sẽ nhận được ngay link invite để tham gia Family Youtube.
Thời gian xử lý: Bạn sẽ nhận được link invite ngay sau khi thanh toán thành công.
Sản phẩm chỉ hỗ trợ kích hoạt và sử dụng tại Việt Nam.', 'https://cdn.divineshop.vn/image/catalog/Anh-SP/Youtube/YouTube%20Premium%20Music-1nam-65910.png?hash=1715587226', 'office', 'HOT', 5.0, 0, true, ARRAY['Kích Hoạt Premium']),

('ad987c8d-215e-4ab9-bd78-c68320076f92', 'Windows 10 Professional - CD Key', 'Lưu ý:
- Key kích hoạt bản quyền Window 10 bản Pro.
- Kích hoạt 1 thiết bị máy tính.', 'https://cdn.divineshop.vn/image/catalog/Anh-SP/Kh%C3%A1c/Windows%2010%20Professional%20CD%20Key-22736.png?hash=1716345943', 'keytool', 'HOT', 5.0, 0, true, ARRAY['Bản Quyền Vĩnh Viễn']),

('79f6d962-4d67-4a71-8311-eb60705bfb78', 'MAPHACK LIÊN QUÂN GOOD AOV', 'Ver GOODAOV SEVER VIETNAM 👑
Các chức năng: HackMap, Show CD, Auto mua bán đồ', 'https://chungchifree.online/upload/IMG_8860.GIF', 'toolhack', 'TOP SALE', 5.0, 0, true, ARRAY['UNLOCK 4 MẮT 4 CHÂN'])
ON CONFLICT (id) DO NOTHING;

-- Insert price tiers
INSERT INTO public.price_tiers (id, product_id, duration, duration_label, price, original_price, is_popular) VALUES 
('88668630-ac43-4f77-88a5-4120bc389cf3', 'ad987c8d-215e-4ab9-bd78-c68320076f92', '1y', '1 Năm', 200000.00, 1000000.00, true),
('847141b7-8be3-42b2-8bca-a6c554390b12', 'ad987c8d-215e-4ab9-bd78-c68320076f92', 'vv', 'Vĩnh Viễn', 100000.00, 1200000.00, true),
('a5ccfc62-fb49-4c4c-8b7b-da95350d487d', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1h', '1 Giờ', 10000.00, 15000.00, true),
('8ddec5a1-c589-47d6-a6c3-1d06702739a5', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1m', '1 Tháng', 200000.00, 500000.00, true),
('96895c2e-4428-4221-bc5b-f43b442d3a17', '79f6d962-4d67-4a71-8311-eb60705bfb78', '1d', '1 Ngày', 20000.00, 30000.00, false),
('dbb356c6-5a12-4219-bc4f-c1178a92aec0', '2c504192-1632-462b-9609-7e5e93784b2f', '3m', '3 Tháng', 500000.00, 1000000.00, false)
ON CONFLICT (id) DO NOTHING;

-- Insert product images
INSERT INTO public.product_images (id, product_id, image_url, display_order) VALUES 
('3518d069-4b82-4bd7-8b5a-fc6b2f7ae80a', 'ad987c8d-215e-4ab9-bd78-c68320076f92', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/ad987c8d-215e-4ab9-bd78-c68320076f92/1767438701051.png', 0),
('495ee4ca-2205-4ad7-890a-566a991a86b1', '79f6d962-4d67-4a71-8311-eb60705bfb78', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/79f6d962-4d67-4a71-8311-eb60705bfb78/1767441385496.png', 0),
('3d7409d9-8225-40cc-aaba-17abdd29fed9', '79f6d962-4d67-4a71-8311-eb60705bfb78', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/product-images/79f6d962-4d67-4a71-8311-eb60705bfb78/1767441387985.png', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert site settings
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
('bank_account', '0651000829668'),
('bank_holder', 'PHAN VAN THANG'),
('bank_branch', 'Chi Nhanh DA NANG')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Insert announcements
INSERT INTO public.announcements (id, title, content, is_active, show_contact_button, contact_button_text, contact_button_url) VALUES 
('96ce4496-0178-4226-b60d-247cde4be108', 'ĐẠI GIẢM GIÁ 50%', 'CÁC BẠN MUA TẤT CẢ HACK LOẠI GAME HIỆN TẠI ĐỀU ĐƯỢC GIẢM GIÁ 50% VÀ NẠP TIỀN CỘNG 10% VỚI GIÁ TRỊ TRÊN 100K', true, true, 'Liên hệ', 'https://t.me/goodgamevietnam')
ON CONFLICT (id) DO NOTHING;

-- Insert banners
INSERT INTO public.banners (id, title, subtitle, description, image_url, button_text, button_url, display_order, is_active) VALUES 
('1f1cb79a-ad6a-4149-a46a-3eaa197320d7', 'KEY BẢN QUYỀN CHÍNH HÃNG', 'Giao key tự động 24/7', 'Cung cấp key phần mềm, game với giá tốt nhất', 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/banners/banner-1767455098393.png', 'Khám phá ngay', '/products', 3, true),
('4214b1fc-3f25-4530-9f63-2b7e50bbf596', 'COMINGSONE', NULL, NULL, 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/banners/banner-1767455373089.png', 'Khám phá ngay', '/products', 1, true),
('6da0de27-6d19-40f6-bdcd-f637ce5ebe88', 'naptien', NULL, NULL, 'https://owxsbhnrvarsejoldamj.supabase.co/storage/v1/object/public/banners/banner-1767456049972.png', 'Khám phá ngay', '/products', 2, true)
ON CONFLICT (id) DO NOTHING;
