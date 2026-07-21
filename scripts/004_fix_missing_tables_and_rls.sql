-- ============================================================
-- 004: Loyihadagi xatolarni tuzatish
-- Bu skriptni Supabase Dashboard -> SQL Editor da ishga tushiring
-- ============================================================

-- ------------------------------------------------------------
-- 1) "staff" jadvalida yo'q bo'lgan ustunlarni qo'shish
--    (Kadrlar sahifasi staff_type va subject_id ni ishlatadi,
--    lekin ular jadvalda umuman yo'q edi -> Xodimlar bo'limi
--    ro'yxatni ham ko'rsata olmas, ham saqlay olmas edi)
-- ------------------------------------------------------------
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS staff_type TEXT
    CHECK (staff_type IN ('technical', 'pedagogue', 'management'))
    DEFAULT 'technical',
  ADD COLUMN IF NOT EXISTS subject_id UUID
    REFERENCES public.subjects(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 2) Umuman mavjud bo'lmagan jadvallarni yaratish
--    (login, foydalanuvchilar va kadrlar/vazifalar shu
--    jadvallarsiz ishlay olmasdi)
-- ------------------------------------------------------------

-- Tizim foydalanuvchilari (custom login uchun)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'director', 'teacher')) DEFAULT 'teacher',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vazifalar (Kadrlar bo'limidagi "Vazifalar" tabi)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vazifaga biriktirilgan fayllar
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vazifaga yozilgan izohlar
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);

-- ------------------------------------------------------------
-- 3) RLS (Row Level Security) ni to'g'ri sozlash
--
--    MUHIM: Loyiha Supabase Auth'dan foydalanmaydi (login
--    localStorage orqali, custom "users" jadvali bilan
--    ishlaydi). Shuning uchun avvalgi policy'lardagi
--    auth.uid() doim NULL bo'ladi va yozish (INSERT/UPDATE/
--    DELETE) amallari sukut bilan bloklanib kelgan.
--
--    Quyida barcha jadvallar uchun policy'lar ilova o'zi
--    login orqali kirishni tekshiradi degan asosda, ochiq
--    (permissive) qilib qo'yiladi.
--
--    XAVFSIZLIK HAQIDA ESLATMA: Supabase "anon key" brauzer
--    kodida ochiq turadi. Ushbu policy'lar bilan, agar kimdir
--    shu anon key'ni bilsa, ilovadagi login ekranini chetlab
--    o'tib, Supabase REST API orqali to'g'ridan-to'g'ri
--    ma'lumotlarni o'qishi/yozishi mumkin. Bu kichik ichki
--    tizim uchun odatiy holat, lekin uzoq muddatda haqiqiy
--    Supabase Auth'ga o'tish tavsiya etiladi.
-- ------------------------------------------------------------

-- Eski, hech qachon ishlamaydigan (auth.uid() ga bog'liq) policy'larni olib tashlash
DROP POLICY IF EXISTS "classes_all_admin" ON public.classes;
DROP POLICY IF EXISTS "subjects_all_admin" ON public.subjects;
DROP POLICY IF EXISTS "departments_all_admin" ON public.departments;
DROP POLICY IF EXISTS "students_all_staff" ON public.students;
DROP POLICY IF EXISTS "staff_all_admin" ON public.staff;
DROP POLICY IF EXISTS "student_attendance_all_staff" ON public.student_attendance;
DROP POLICY IF EXISTS "staff_attendance_all_admin" ON public.staff_attendance;
DROP POLICY IF EXISTS "schedule_all_admin" ON public.schedule;
DROP POLICY IF EXISTS "grades_all_staff" ON public.grades;
DROP POLICY IF EXISTS "events_all_staff" ON public.events;
DROP POLICY IF EXISTS "discipline_all_staff" ON public.discipline_records;
DROP POLICY IF EXISTS "curriculum_all_admin" ON public.curriculum;

-- O'rniga ilova o'zi kirishni tekshiradi, deb hisoblab, yozishga ruxsat beruvchi policy'lar
CREATE POLICY "classes_write" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "subjects_write" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "departments_write" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "students_write" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "staff_write" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "student_attendance_write" ON public.student_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "staff_attendance_write" ON public.staff_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "schedule_write" ON public.schedule FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "grades_write" ON public.grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "events_write" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "discipline_write" ON public.discipline_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "curriculum_write" ON public.curriculum FOR ALL USING (true) WITH CHECK (true);

-- Yangi jadvallar uchun RLS yoqish va ochiq policy qo'yish
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_all" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tasks_all" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "task_attachments_all" ON public.task_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "task_comments_all" ON public.task_comments FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4) Boshlang'ich admin foydalanuvchi
--    (login sahifasidagi "Test uchun: admin / admin123" ga mos)
-- ------------------------------------------------------------
INSERT INTO public.users (username, password_hash, full_name, role, is_active)
VALUES ('admin', 'admin123', 'Administrator', 'admin', true)
ON CONFLICT (username) DO NOTHING;
