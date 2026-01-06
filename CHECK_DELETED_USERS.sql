-- Kiểm tra trạng thái của 2 user đã xóa

-- 1. Kiểm tra trong profiles (xem deleted_at, email, balance)
SELECT 
  id, 
  email, 
  phone, 
  full_name, 
  balance,
  deleted_at,
  CASE 
    WHEN deleted_at IS NOT NULL THEN 'DELETED ✅'
    ELSE 'ACTIVE ❌'
  END as status
FROM public.profiles 
WHERE id IN ('9b0350b5-3c2e-4124-95fb-1a75629ec56e', '0d7e4eb0-00df-48a0-9929-585a8bdf8fa2');

-- 2. Kiểm tra user_roles (phải trống)
SELECT 
  user_id, 
  role,
  CASE 
    WHEN user_id IN ('9b0350b5-3c2e-4124-95fb-1a75629ec56e', '0d7e4eb0-00df-48a0-9929-585a8bdf8fa2') THEN '❌ VẪN CÒN'
    ELSE '✅ OK'
  END as status
FROM public.user_roles 
WHERE user_id IN ('9b0350b5-3c2e-4124-95fb-1a75629ec56e', '0d7e4eb0-00df-48a0-9929-585a8bdf8fa2');

-- 3. Đếm số lượng để kiểm tra nhanh
SELECT 
  'Profiles marked as deleted' as check_type,
  COUNT(*) as count
FROM public.profiles 
WHERE id IN ('9b0350b5-3c2e-4124-95fb-1a75629ec56e', '0d7e4eb0-00df-48a0-9929-585a8bdf8fa2')
AND deleted_at IS NOT NULL

UNION ALL

SELECT 
  'User roles remaining (should be 0)' as check_type,
  COUNT(*) as count
FROM public.user_roles 
WHERE user_id IN ('9b0350b5-3c2e-4124-95fb-1a75629ec56e', '0d7e4eb0-00df-48a0-9929-585a8bdf8fa2');

-- 4. Kiểm tra auth.users vẫn tồn tại (bình thường vì soft delete)
SELECT 
  id, 
  email,
  '⚠️ Vẫn trong auth.users (bình thường vì soft delete)' as note
FROM auth.users 
WHERE id IN ('9b0350b5-3c2e-4124-95fb-1a75629ec56e', '0d7e4eb0-00df-48a0-9929-585a8bdf8fa2');
