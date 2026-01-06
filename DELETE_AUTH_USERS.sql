-- Xóa user pvt267.2k1@gmail.com từ auth.users để không thể login lại

-- ⚠️ QUAN TRỌNG: Chạy trong Supabase Dashboard > SQL Editor

-- Xóa user pvt267.2k1@gmail.com
DELETE FROM auth.users WHERE email = 'pvt267.2k1@gmail.com';

-- Xóa user win2kidevlor@gmail.com  
DELETE FROM auth.users WHERE email = 'win2kidevlor@gmail.com';

-- Kiểm tra lại (phải trả về 0 rows)
SELECT id, email FROM auth.users 
WHERE email IN ('pvt267.2k1@gmail.com', 'win2kidevlor@gmail.com');
