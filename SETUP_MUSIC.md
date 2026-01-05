# 🎵 Cách thêm trường music_url vào Database

## Bước 1: Vào Supabase Dashboard

1. Truy cập: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click vào project của bạn
3. Vào **SQL Editor** (bên trái menu)

## Bước 2: Chạy SQL này

```sql
-- Add music_url to site_settings table
INSERT INTO site_settings (key, value)
VALUES ('music_url', '')
ON CONFLICT (key) DO NOTHING;
```

## Bước 3: Click "Run" hoặc nhấn Ctrl+Enter

## Bước 4: Kiểm tra

Chạy query này để xem kết quả:

```sql
SELECT * FROM site_settings WHERE key = 'music_url';
```

Bạn sẽ thấy 1 dòng mới với `key = 'music_url'` và `value = ''`

## Bước 5: Test

1. Vào **Admin → Settings → Tab "Nhạc nền"**
2. Nhập link YouTube hoặc file audio
3. Click "Lưu thay đổi"
4. Refresh trang chủ → Thấy nút nhạc ở góc dưới phải
5. Click nút để phát nhạc!

---

## ✅ Mẫu link test:

### YouTube:

- Lofi: `https://www.youtube.com/watch?v=jfKfPfyJRdk`
- Gaming: `https://www.youtube.com/watch?v=5qap5aO4i9A`

### Direct Audio (nếu có):

- `https://your-domain.com/music.mp3`
- `https://cdn.example.com/background-music.mp3`

---

## 🐛 Troubleshooting:

**Lỗi: "duplicate key value"**
→ Trường đã tồn tại, không cần chạy lại

**Lỗi: "relation site_settings does not exist"**
→ Bảng `site_settings` chưa có, cần chạy migration đầy đủ

**Console vẫn show `rawMusicUrl: ''`**
→ Chưa lưu link trong Admin Settings, hoặc cache browser. Hard refresh (Ctrl+Shift+R)
