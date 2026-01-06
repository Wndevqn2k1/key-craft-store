# 🔒 KIỂM TRA BẢO MẬT - HƯỚNG DẪN TEST

## ✅ CHECKLIST CÁC MIGRATION ĐÃ TẠO

1. ✅ `20260107000000_fix_balance_manipulation.sql` - Fix user tự nạp tiền
2. ✅ `20260107000001_secure_checkout_function.sql` - Secure checkout flow
3. ✅ `20260106000002_fix_key_security.sql` - Fix key exposure

---

## 🧪 TEST CASE 1: User KHÔNG THỂ tự nạp tiền

**Cách test:**

1. Login với tài khoản user bình thường
2. Mở browser console (F12)
3. Chạy lệnh:

```javascript
const { data: user } = await supabase.auth.getUser();
const result = await supabase
  .from("profiles")
  .update({ balance: 999999999 })
  .eq("id", user.data.user.id);

console.log(result);
```

**Kết quả mong đợi:**

- ❌ Error hoặc không thay đổi balance
- ✅ Balance vẫn giữ nguyên giá trị cũ

**Nếu balance BỊ THAY ĐỔI:**
→ ⚠️ Migration `20260107000000_fix_balance_manipulation.sql` CHƯA được apply!

---

## 🧪 TEST CASE 2: Reseller thấy stock count

**Cách test:**

1. Login với tài khoản reseller
2. Vào trang sản phẩm bất kỳ
3. Kiểm tra số lượng key hiển thị

**Kết quả mong đợi:**

- ✅ Hiển thị số lượng key (VD: "Còn 10 key")
- ✅ KHÔNG hiển thị "Hết hàng" nếu còn key

**Nếu vẫn hiển thị "Hết hàng":**
→ ⚠️ Migration `20260106000002_fix_key_security.sql` CHƯA được apply!

---

## 🧪 TEST CASE 3: Function get_available_keys_count tồn tại

**Cách test:**

1. Mở browser console (F12)
2. Chạy lệnh:

```javascript
const { data, error } = await supabase.rpc("get_available_keys_count", {
  p_product_id: "ANY_PRODUCT_ID", // Thay bằng ID sản phẩm thật
  p_price_tier_ids: ["ANY_TIER_ID"], // Thay bằng tier ID thật
});

console.log("Data:", data);
console.log("Error:", error);
```

**Kết quả mong đợi:**

- ✅ Trả về data với format `[{price_tier_id: '...', available_count: 10}]`
- ✅ Không có error

**Nếu có error "function ... does not exist":**
→ ⚠️ Migration `20260106000002_fix_key_security.sql` CHƯA được apply!

---

## 🧪 TEST CASE 4: Function process_secure_checkout tồn tại

**Cách test:**

1. Mở browser console (F12)
2. Chạy lệnh:

```javascript
// Chỉ test xem function có tồn tại không, ĐỪNG THỰC SỰ MUA!
const { data, error } = await supabase.rpc("process_secure_checkout", {
  p_user_id: "test",
  p_total_amount: 0,
  p_order_items: [],
});

console.log("Error:", error);
// Sẽ có error nhưng quan trọng là function TỒN TẠI
```

**Kết quả mong đợi:**

- ✅ Error về logic (vì test data sai) NHƯNG function TỒN TẠI
- ❌ KHÔNG phải error "function ... does not exist"

**Nếu error là "function does not exist":**
→ ⚠️ Migration `20260107000001_secure_checkout_function.sql` CHƯA được apply!

---

## 🧪 TEST CASE 5: Admin policy cho balance update

**Cách test:**

1. Login với tài khoản admin
2. Vào trang Admin Users
3. Chọn 1 user và nạp tiền
4. Verify balance được cộng

**Kết quả mong đợi:**

- ✅ Admin CÓ THỂ update balance của user khác
- ✅ Balance được cộng thành công

**Nếu admin KHÔNG thể nạp tiền:**
→ ⚠️ Policy bị lỗi, cần check lại

---

## 📊 TỔNG KẾT TRẠNG THÁI

### Migrations tồn tại trên GitHub: ✅

- ✅ 20260107000000_fix_balance_manipulation.sql
- ✅ 20260107000001_secure_checkout_function.sql
- ✅ 20260106000002_fix_key_security.sql

### Cần test:

- [ ] Test Case 1: User không tự nạp tiền
- [ ] Test Case 2: Reseller thấy stock
- [ ] Test Case 3: Function get_available_keys_count
- [ ] Test Case 4: Function process_secure_checkout
- [ ] Test Case 5: Admin update balance

---

## ⚠️ CÁCH APPLY MIGRATIONS NẾU CHƯA

### Option 1: Via Supabase Dashboard (KHUYẾN NGHỊ)

1. Vào https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy nội dung từng migration file
3. Paste vào SQL Editor
4. Click Run
5. Verify "Success"

### Option 2: Via Supabase CLI

```bash
cd supabase
supabase db push
```

---

## 📝 GHI CHÚ

**Migrations đã tạo nhưng CHƯA TỰ ĐỘNG APPLY!**

Bạn cần:

1. Apply thủ công trên Supabase Dashboard
2. Hoặc dùng `supabase db push`
3. Sau đó test lại 5 test cases trên

**Migrations là CODE, không phải DATABASE!**

- Tạo migration file ≠ Thay đổi database
- Phải RUN migration mới có hiệu lực
