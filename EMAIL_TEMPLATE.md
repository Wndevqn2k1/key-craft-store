# Hướng dẫn cấu hình Email Template cho Supabase

## Bước 1: Truy cập Supabase Dashboard

1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **Authentication** → **Email Templates**

## Bước 2: Cấu hình Site URL

1. Vào **Project Settings** → **Authentication**
2. Tìm mục **Site URL**
3. Nhập URL website của bạn (ví dụ: `https://yourdomain.com` hoặc `http://localhost:5173` cho dev)
4. Tìm mục **Redirect URLs**
5. Thêm URL: `https://yourdomain.com/auth` (hoặc domain thực tế của bạn)

## Bước 3: Chỉnh sửa Email Template "Confirm signup"

Trong mục **Email Templates**, chọn **Confirm signup** và thay thế nội dung bằng template sau:

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Xác nhận đăng ký - GOODTEAM</title>
  </head>
  <body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;"
  >
    <table
      role="presentation"
      style="width: 100%; border-collapse: collapse; background-color: #f4f4f5;"
    >
      <tr>
        <td align="center" style="padding: 40px 20px;">
          <table
            role="presentation"
            style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
          >
            <!-- Header -->
            <tr>
              <td
                style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;"
              >
                <h1
                  style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);"
                >
                  🎮 GOODTEAM
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                <h2
                  style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;"
                >
                  Chào mừng bạn đến với GOODTEAM! 🎉
                </h2>

                <p
                  style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;"
                >
                  Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng
                  ký, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấn vào
                  nút bên dưới:
                </p>

                <!-- CTA Button -->
                <table role="presentation" style="margin: 30px 0;">
                  <tr>
                    <td align="center">
                      <a
                        href="{{ .ConfirmationURL }}"
                        style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;"
                      >
                        ✅ Xác nhận Email
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="margin: 30px 0 20px; color: #71717a; font-size: 14px; line-height: 1.6;"
                >
                  Nếu nút không hoạt động, bạn có thể sao chép và dán đường link
                  sau vào trình duyệt:
                </p>

                <div
                  style="padding: 12px; background-color: #f4f4f5; border-radius: 6px; word-break: break-all;"
                >
                  <code style="color: #667eea; font-size: 13px;"
                    >{{ .ConfirmationURL }}</code
                  >
                </div>

                <p
                  style="margin: 30px 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;"
                >
                  <strong>Lưu ý:</strong> Link xác nhận này sẽ hết hạn sau 24
                  giờ. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua
                  email này.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; border-top: 1px solid #e4e4e7;"
              >
                <p
                  style="margin: 0 0 10px; color: #71717a; font-size: 14px; text-align: center;"
                >
                  Bạn nhận được email này vì đã đăng ký tài khoản tại GOODTEAM
                </p>
                <p
                  style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;"
                >
                  © 2026 GOODTEAM. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Bước 4: Cập nhật code để redirect về trang auth

File `AuthContext.tsx` đã được cấu hình để redirect về trang chủ sau khi xác nhận. Để redirect về trang đăng nhập, code đã được cập nhật tự động.

## Bước 5: Test

1. Đăng ký tài khoản mới
2. Kiểm tra email (có thể trong spam)
3. Nhấn vào nút "Xác nhận Email"
4. Bạn sẽ được redirect về trang đăng nhập của website

## Lưu ý

- Template này sử dụng inline CSS để đảm bảo hiển thị đúng trên mọi email client
- Màu sắc gradient phù hợp với theme của website
- Responsive và hiển thị tốt trên mobile
- Email template chỉ thay đổi được trên Supabase Dashboard, không thể thay đổi qua code
