# 🔐 BÁO CÁO BẢO MẬT - PRODUCT KEYS

## ⚠️ LỖ HỔNG ĐÃ PHÁT HIỆN VÀ SỬA

### Vấn đề ban đầu:

Policy cũ cho phép **MỌI USER** xem hết `key_value` của keys available:

```sql
CREATE POLICY "Anyone can view available keys for stock count"
ON product_keys FOR SELECT
TO authenticated
USING (status = 'available');
```

**Hậu quả:**

- ❌ Kẻ gian có thể mở DevTools, xem Network tab
- ❌ Có thể query trực tiếp: `supabase.from('product_keys').select('key_value').eq('status', 'available')`
- ❌ Lấy được TOÀN BỘ keys chưa bán mà không cần mua
- ❌ Admin cũng bị lộ keys nếu có người debug

## ✅ GIẢI PHÁP ĐÃ ÁP DỤNG

### 1. Tạo Secure Function (Không expose key_value)

```sql
CREATE FUNCTION get_available_keys_count(
  p_product_id UUID,
  p_price_tier_ids UUID[]
)
RETURNS TABLE (
  price_tier_id UUID,
  available_count BIGINT
)
```

**Đặc điểm:**

- ✅ Chỉ trả về COUNT, KHÔNG bao giờ trả về `key_value`
- ✅ Dùng `SECURITY DEFINER` - chạy với quyền của owner
- ✅ Không thể hack để lấy key_value

### 2. Hạn chế RLS Policies

**CHỈ 3 policies còn lại:**

1. **Users can view their purchased keys**: Chỉ xem keys ĐÃ MUA
2. **Admins can manage all keys**: Admin toàn quyền
3. **Service role can manage all keys**: Edge Functions

**Không còn policy nào cho phép xem available keys!**

### 3. Cập nhật Frontend

```typescript
// CŨ - KHÔNG AN TOÀN
const { data } = await supabase
  .from("product_keys")
  .select("key_value, price_tier_id") // ❌ Lộ key_value
  .eq("status", "available");

// MỚI - AN TOÀN
const { data } = await supabase.rpc("get_available_keys_count", {
  p_product_id: productId,
  p_price_tier_ids: tierIds,
}); // ✅ Chỉ trả về count
```

## 🛡️ CÁC LỚP BẢO VỆ

| Lớp                 | Bảo vệ                                   | Trạng thái   |
| ------------------- | ---------------------------------------- | ------------ |
| **Database RLS**    | Chặn SELECT trực tiếp key_value          | ✅ Đã fix    |
| **Secure Function** | Chỉ trả về count, không expose data      | ✅ Đã tạo    |
| **Frontend**        | Không query key_value của available keys | ✅ Đã update |
| **Admin Only**      | Chỉ admin xem được all keys              | ✅ Đã có     |
| **Purchased Only**  | User chỉ xem keys đã mua                 | ✅ Đã có     |

## 🚨 CÁCH KIỂM TRA BẢO MẬT

### Test 1: User thường thử lấy keys

```javascript
// Thử hack trong DevTools Console
const { data } = await supabase
  .from("product_keys")
  .select("*")
  .eq("status", "available");

console.log(data); // Phải trả về [] (empty) hoặc error
```

### Test 2: Reseller thử lấy keys

```javascript
const { data } = await supabase.from("product_keys").select("key_value");

console.log(data); // Phải chỉ thấy keys ĐÃ MUA
```

### Test 3: Count vẫn hoạt động

```javascript
const { data } = await supabase.rpc("get_available_keys_count", {
  p_product_id: "uuid-here",
  p_price_tier_ids: ["uuid1", "uuid2"],
});

console.log(data); // Phải trả về [{price_tier_id, available_count}]
```

## 📋 CHECKLIST DEPLOYMENT

Khi deploy lên production, chạy theo thứ tự:

1. ✅ Apply migration: `20260106000002_fix_key_security.sql`
2. ✅ Verify function tạo thành công: `get_available_keys_count`
3. ✅ Verify policies: Chỉ còn 3 policies
4. ✅ Deploy frontend code mới
5. ✅ Test bằng user thường (không phải admin)
6. ✅ Test count stock vẫn hoạt động

## 🎯 KẾT LUẬN

**Trước khi fix:**

- 🔴 CRITICAL: Bất kỳ ai login cũng xem được ALL keys

**Sau khi fix:**

- 🟢 SECURE: User chỉ xem keys đã mua
- 🟢 SECURE: Stock count không lộ key_value
- 🟢 SECURE: Admin vẫn quản lý được all keys
- 🟢 SECURE: Không thể hack qua DevTools

## ⚡ HÀNH ĐỘNG YÊU CẦU

**BẮT BUỘC chạy ngay lập tức:**

```sql
-- File: 20260106000002_fix_key_security.sql
-- Chạy trên Supabase Dashboard → SQL Editor
```

**SAU ĐÓ deploy code mới từ commit này.**

---

**Cảnh báo:** KHÔNG deploy code cũ sau khi đã apply migration này, nếu không stock sẽ không hiển thị!
