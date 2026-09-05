-- ============================================================
-- 007: Talaba login tizimi va Davomat/FaceID uchun yetishmayotgan
--      ustunlarni qo'shish (chuqur audit natijasida topilgan)
--
--    Bu skriptni Supabase Dashboard -> SQL Editor da ishga
--    tushiring. 001-006 skriptlaridan KEYIN ishlatilishi shart.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Talaba login tizimi ("students" jadvali)
--
--    Muammo: app/(dashboard)/oquv-bolimi/page.tsx har bir yangi
--    o'quvchi qo'shilganda unga avtomatik "username" va
--    "password_hash" yaratib, students jadvaliga yozadi.
--    app/talaba/login/page.tsx ham talaba tizimga kirganda shu
--    ikki ustundan foydalanadi. Lekin "students" jadvalida bu
--    ustunlar umuman yaratilmagan edi -> yangi o'quvchi qo'shish
--    HAM, talaba tizimga kirish HAM ishlamas edi.
-- ------------------------------------------------------------

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ------------------------------------------------------------
-- 2) Davomat va FaceID integratsiyasi
--    ("student_attendance" va "staff_attendance" jadvallari)
--
--    Muammo: app/(dashboard)/davomat/page.tsx sahifasi ikkala
--    jadvaldan ham "source" ustunini, "student_attendance" dan
--    esa qo'shimcha "check_in_time"/"check_out_time" ustunlarini
--    o'qishga harakat qiladi. app/api/faceid/checkin/route.ts
--    ham aynan shu ustunlarga yozadi. Ammo:
--      - "student_attendance" da bu uchala ustun ham yo'q edi
--      - "staff_attendance" da "source" ustuni yo'q edi
--    Natijada Davomat sahifasi umuman yuklanmas ("column does
--    not exist" xatoligi), FaceID orqali kelgan so'rovlar esa
--    saqlanmay xatolik qaytarardi.
-- ------------------------------------------------------------

ALTER TABLE public.student_attendance
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'faceid')),
  ADD COLUMN IF NOT EXISTS check_in_time TIME,
  ADD COLUMN IF NOT EXISTS check_out_time TIME;

ALTER TABLE public.staff_attendance
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'faceid'));
