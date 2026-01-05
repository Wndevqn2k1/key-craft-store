# 🚀 Hướng dẫn Deploy Edge Function

## Project Info

- **Project Ref**: `hnudnukpzatazggejgws`
- **Project Name**: muhackvip
- **Dashboard**: https://supabase.com/dashboard/project/hnudnukpzatazggejgws

## Bước 1: Mở Edge Functions

1. Truy cập: https://supabase.com/dashboard/project/hnudnukpzatazggejgws/functions
2. Nếu chưa thấy sidebar "Edge Functions", click vào icon menu (☰) góc trái

## Bước 2: Tạo Function

1. Click nút **"Create a new function"** màu xanh
2. Điền thông tin:
   - **Function name**: `check-vcb-transactions`
   - Click **"Create function"**

## Bước 3: Deploy Code

### Cách 1: Copy từ clipboard (ĐÃ COPY SẴN)

1. Trong editor của Supabase, nhấn **Ctrl+A** → **Ctrl+V**
2. Code đã được copy sẵn vào clipboard
3. Click nút **"Deploy"** màu xanh

### Cách 2: Copy thủ công

```bash
# Chạy lệnh này để copy lại code
Get-Content "supabase\functions\check-vcb-transactions\index.ts" -Raw | Set-Clipboard
```

## Bước 4: Kiểm tra Function

1. Sau khi deploy xong, mở trang nạp tiền: http://localhost:8080/deposit
2. Thực hiện chuyển khoản test
3. Click nút **"Kiểm tra ngay"**
4. Mở Console (F12) xem logs

## Xem Logs

- **Function Logs**: https://supabase.com/dashboard/project/hnudnukpzatazggejgws/functions/check-vcb-transactions/logs
- Logs sẽ hiển thị:
  - 🔍 Thông tin deposit đang check
  - 📝 Chi tiết từng transaction
  - ✅ Kết quả match
  - ❌ Lý do không match

## Troubleshooting

### Lỗi: "This project does not exist"

→ Đảm bảo đang dùng đúng project ref: `hnudnukpzatazggejgws`

### Không thấy menu "Edge Functions"

→ Project có thể chưa enable Edge Functions. Liên hệ admin project.

### Function deploy nhưng không chạy

→ Kiểm tra Environment Variables trong Settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Code Location

File code: `supabase/functions/check-vcb-transactions/index.ts`
