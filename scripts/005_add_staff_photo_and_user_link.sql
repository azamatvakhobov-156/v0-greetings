-- ============================================================
-- 005: "staff" jadvalida yetishmayotgan ustunlarni qo'shish
--
--    Muammo: Xodimlar (foydalanuvchilar) bo'limi staff yozuviga
--    photo_url va user_id ustunlarini yozishga harakat qiladi,
--    lekin bu ustunlar "staff" jadvalida hech qachon yaratilmagan
--    edi (001-migratsiyada yo'q, 004-migratsiyada ham unutilgan).
--    Shu sabab xodim fotosuratini saqlashda "column not found"
--    xatoligi yuzaga kelib, butun yozuv saqlanmay qolar edi.
--
--    Bu skriptni Supabase Dashboard -> SQL Editor da ishga
--    tushiring.
-- ============================================================

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
