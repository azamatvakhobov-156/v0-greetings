-- GPS orqali davomat tizimi uchun jadvallar

-- GPS davomat sozlamalari (maktab joylashuvi)
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT DEFAULT '156-maktab',
  school_latitude DECIMAL(10, 8) NOT NULL,
  school_longitude DECIMAL(11, 8) NOT NULL,
  allowed_radius INTEGER DEFAULT 100, -- metrda
  check_in_start TIME DEFAULT '07:30:00',
  check_in_end TIME DEFAULT '09:00:00',
  check_out_start TIME DEFAULT '14:00:00',
  check_out_end TIME DEFAULT '18:00:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GPS davomat log yozuvlari
CREATE TABLE IF NOT EXISTS public.gps_attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  user_latitude DECIMAL(10, 8) NOT NULL,
  user_longitude DECIMAL(11, 8) NOT NULL,
  distance_meters INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('check_in', 'check_out')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'manual')),
  device_info TEXT,
  ip_address TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS yoqish
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_attendance_logs ENABLE ROW LEVEL SECURITY;

-- Attendance settings policies
CREATE POLICY "attendance_settings_select_all" ON public.attendance_settings FOR SELECT USING (true);
CREATE POLICY "attendance_settings_all_admin" ON public.attendance_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- GPS logs policies
CREATE POLICY "gps_logs_select_own" ON public.gps_attendance_logs FOR SELECT USING (
  staff_id IN (SELECT id FROM public.staff WHERE profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_hr'))
);

CREATE POLICY "gps_logs_insert_own" ON public.gps_attendance_logs FOR INSERT WITH CHECK (
  staff_id IN (SELECT id FROM public.staff WHERE profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_hr'))
);

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_gps_logs_staff_id ON public.gps_attendance_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_recorded_at ON public.gps_attendance_logs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_gps_logs_action ON public.gps_attendance_logs(action);

-- staff_attendance jadvaliga GPS ma'lumotlarini qo'shish
ALTER TABLE public.staff_attendance 
  ADD COLUMN IF NOT EXISTS check_in_method TEXT DEFAULT 'manual' CHECK (check_in_method IN ('manual', 'gps', 'qr')),
  ADD COLUMN IF NOT EXISTS gps_log_id UUID REFERENCES public.gps_attendance_logs(id);

-- Boshlang'ich maktab sozlamalari (Toshkent, 156-maktab uchun taxminiy koordinatalar)
INSERT INTO public.attendance_settings (school_name, school_latitude, school_longitude, allowed_radius)
VALUES ('156-maktab', 41.311081, 69.240562, 100)
ON CONFLICT DO NOTHING;
