# 🔒 TEST CÁC LỖ HỔNG KHÁC

## 🧪 TEST 1: User KHÔNG THỂ xem key_value của keys chưa mua

**Mục đích:** Kiểm tra xem user có thể truy cập key_value của available keys không

**Cách test:**

```javascript
// Test 1: Thử query tất cả available keys
const { data, error } = await supabase
  .from("product_keys")
  .select("key_value, status, product_id")
  .eq("status", "available");

console.log("Data:", data);
console.log("Error:", error);
```

**Kết quả mong đợi:**

- ✅ **data: [] (mảng rỗng)** hoặc **data: null**
- ✅ Không thấy bất kỳ key_value nào

**Nếu thấy key_value:**

- ❌ CRITICAL - Migration `20260106000002_fix_key_security.sql` chưa apply
- ❌ User có thể lấy ALL keys miễn phí!

---

## 🧪 TEST 2: User CHỈ thấy keys đã mua

**Cách test:**

```javascript
// Sau khi MUA sản phẩm, query lại:
const { data: myKeys } = await supabase
  .from("product_keys")
  .select("key_value, status, product_id")
  .eq("status", "sold")
  .eq("buyer_id", (await supabase.auth.getUser()).data.user.id);

console.log("My purchased keys:", myKeys);
```

**Kết quả mong đợi:**

- ✅ Thấy key_value của keys ĐÃ MUA
- ✅ Chỉ thấy keys có buyer_id = user hiện tại

---

## 🧪 TEST 3: Function get_available_keys_count tồn tại

**Cách test:**

```javascript
// Lấy ID sản phẩm bất kỳ từ trang products
const productId = "PRODUCT_ID_HERE"; // Thay bằng ID thật

const { data: product } = await supabase
  .from("products")
  .select("id, price_tiers(id)")
  .eq("id", productId)
  .single();

// Test RPC function
const { data: stockData, error } = await supabase.rpc(
  "get_available_keys_count",
  {
    p_product_id: product.id,
    p_price_tier_ids: product.price_tiers.map((t) => t.id),
  }
);

console.log("Stock counts:", stockData);
console.log("Error:", error);
```

**Kết quả mong đợi:**

- ✅ Trả về `[{price_tier_id: '...', available_count: 10}]`
- ✅ KHÔNG có key_value
- ✅ Chỉ có số lượng

**Nếu error "function does not exist":**

- ❌ Migration chưa apply

---

## 🧪 TEST 4: Admin KHÔNG thể tự assign keys cho mình

**Cách test (với tài khoản admin):**

```javascript
// Admin thử tự gán key
const { data, error } = await supabase
  .from("product_keys")
  .update({
    status: "sold",
    buyer_id: (await supabase.auth.getUser()).data.user.id,
  })
  .eq("status", "available")
  .limit(1);

console.log("Error:", error);
```

**Kết quả mong đợi:**

- ⚠️ Admin CÓ THỂ làm điều này (vì admin có full access)
- ✅ Nhưng phải qua orders table (có audit trail)

**Recommendation:**

- Admin nên mua qua flow checkout để có order history
- Hoặc tạo function riêng cho admin test với logging

---

## 🧪 TEST 5: Không thể gọi assign_product_keys trực tiếp

**Cách test:**

```javascript
// User thử gọi function assign keys
const { data, error } = await supabase.rpc("assign_product_keys", {
  p_order_id: "fake-order-id",
  p_product_id: "some-product-id",
  p_price_tier_id: "some-tier-id",
  p_quantity: 1,
  p_unit_price: 0,
  p_buyer_id: (await supabase.auth.getUser()).data.user.id,
});

console.log("Error:", error);
```

**Kết quả mong đợi:**

- ✅ Error: "Unauthorized order access"
- ✅ Function kiểm tra order phải thuộc về user

**Nếu assign thành công:**

- ❌ HIGH - User có thể lấy keys miễn phí!

---

## 🧪 TEST 6: Không thể tạo order với total_amount = 0

**Cách test:**

```javascript
const { data, error } = await supabase.from("orders").insert({
  user_id: (await supabase.auth.getUser()).data.user.id,
  total_amount: 0,
  status: "paid",
});

console.log("Error:", error);
```

**Kết quả mong đợi:**

- ⚠️ CÓ THỂ tạo order $0 (nếu không có constraint)
- ⚠️ Nhưng assign_product_keys sẽ fail vì không có order_items

**Recommendation:**

- Thêm CHECK constraint: `total_amount > 0`
- Hoặc validate ở frontend

---

## 📊 CHECKLIST BẢO MẬT

### Critical Issues:

- [ ] Test 1: User không thấy available keys
- [ ] Test 3: Function get_available_keys_count hoạt động
- [ ] Test 5: Không gọi trực tiếp assign_product_keys

### High Issues:

- [ ] Test 2: User chỉ thấy keys đã mua
- [ ] Test 6: Không tạo order $0

### Medium Issues:

- [ ] Test 4: Admin có audit trail

---

## ⚠️ CÁC LỖ HỔNG ĐÃ BIẾT

### ✅ ĐÃ FIX:

1. ✅ User tự nạp tiền - Fixed by migration 20260107000000
2. ✅ Key exposure - Fixed by migration 20260106000002
3. ✅ Checkout race condition - Fixed by migration 20260107000001

### ⚠️ CẦN KIỂM TRA:

1. ❓ Migration 20260106000002 đã apply chưa?
2. ❓ RLS policies cho product_keys đúng chưa?
3. ❓ Function get_available_keys_count tồn tại chưa?

---

## 🔧 CÁCH VERIFY MIGRATIONS ĐÃ APPLY

```sql
-- Chạy trên Supabase SQL Editor:

-- 1. Check policies cho product_keys
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'product_keys';

-- 2. Check function tồn tại
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_available_keys_count';

-- 3. Check function assign_product_keys
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'assign_product_keys';
```

**Kết quả mong đợi:**

1. Có 3 policies: "Users can view their purchased keys", "Admins can manage all keys", "Service role"
2. Function get_available_keys_count tồn tại
3. Function assign_product_keys có check "Unauthorized order access"
