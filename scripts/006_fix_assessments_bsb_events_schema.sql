-- ============================================================
-- 006: Yetishmayotgan jadvallar va sxema nomuvofiqliklarini
--      tuzatish (chuqur audit natijasida topilgan)
--
--    Bu skriptni Supabase Dashboard -> SQL Editor da ishga
--    tushiring. 001-005 skriptlaridan KEYIN ishlatilishi shart.
-- ============================================================

-- ------------------------------------------------------------
-- 1) "Summativ baholash" bo'limi (testlar, BSB/CHSB) uchun
--    kod bir nechta jadvalga murojaat qiladi, lekin ular
--    umuman yaratilmagan edi -> bo'lim to'liq ishlamas edi
--    ("relation does not exist" xatoligi).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('bsb', 'chsb')),
  bsb_number INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  join_code TEXT UNIQUE,
  instructions TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'free_response')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points DECIMAL(6, 2) NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  total_score DECIMAL(6, 2),
  max_score DECIMAL(6, 2),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  is_correct BOOLEAN,
  points_earned DECIMAL(6, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment_id ON public.assessment_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_submission_id ON public.assessment_responses(submission_id);

-- ------------------------------------------------------------
-- 2) BSB (baholash sinov baholari) jadvallari - shuningdek
--    umuman mavjud emas edi.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.bsb_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  bsb_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (subject_id, class_id, quarter, bsb_number)
);

CREATE TABLE IF NOT EXISTS public.bsb_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bsb_assessment_id UUID NOT NULL REFERENCES public.bsb_assessments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_score DECIMAL(6, 2) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bsb_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bsb_assessment_id UUID NOT NULL REFERENCES public.bsb_assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.bsb_criteria(id) ON DELETE CASCADE,
  score DECIMAL(6, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (bsb_assessment_id, student_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_bsb_criteria_assessment_id ON public.bsb_criteria(bsb_assessment_id);
CREATE INDEX IF NOT EXISTS idx_bsb_scores_assessment_id ON public.bsb_scores(bsb_assessment_id);

-- ------------------------------------------------------------
-- 3) "grades" jadvalidagi ikkita xatolik:
--    a) grade_type CHECK cheklovi faqat 'summative_1..4','final'
--       qiymatlariga ruxsat berardi, lekin kod 'bsb_1','bsb_2'...
--       kabi qiymatlarni ham yozadi -> CHECK constraint xatoligi
--       bilan saqlash rad etilardi.
--    b) upsert(...,{onConflict:"student_id,subject_id,grade_type,quarter"})
--       ishlatiladi, lekin bunday UNIQUE cheklov jadvalda yo'q
--       edi -> "no unique or exclusion constraint" xatoligi.
-- ------------------------------------------------------------

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_grade_type_check;
ALTER TABLE public.grades ADD CONSTRAINT grades_grade_type_check
  CHECK (grade_type IN ('summative_1', 'summative_2', 'summative_3', 'summative_4', 'final')
         OR grade_type ~ '^bsb_[0-9]+$');

ALTER TABLE public.grades ADD CONSTRAINT grades_unique_entry
  UNIQUE (student_id, subject_id, grade_type, quarter);

-- ------------------------------------------------------------
-- 4) "Manaviyat" bo'limi:
--    a) event_photos jadvali umuman yo'q edi.
--    b) events.select() "created_by" ustunini va users(full_name)
--       join'ini so'raydi, lekin jadvalda faqat organizer_id
--       (profiles'ga bog'langan) bor edi -> "could not find
--       relationship" xatoligi bilan bo'lim umuman yuklanmasdi.
-- ------------------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);

-- ------------------------------------------------------------
-- 5) RLS: loyihada Supabase Auth ishlatilmaydi (custom "users"
--    jadvali + localStorage bilan login qilinadi), shuning
--    uchun 004-skriptdagi kabi barcha yangi jadvallarga ham
--    ochiq (permissive) policy qo'yiladi.
-- ------------------------------------------------------------

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsb_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsb_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsb_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments_write" ON public.assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "assessment_questions_write" ON public.assessment_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "assessment_submissions_write" ON public.assessment_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "assessment_responses_write" ON public.assessment_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "bsb_assessments_write" ON public.bsb_assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "bsb_criteria_write" ON public.bsb_criteria FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "bsb_scores_write" ON public.bsb_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "event_photos_write" ON public.event_photos FOR ALL USING (true) WITH CHECK (true);

-- ESLATMA: "assessments.created_by" hozircha kod tomonidan
-- to'ldirilmaydi (testlar/page.tsx buni yubormaydi) - bu ustun
-- ixtiyoriy (NULL bo'lishi mumkin) bo'lgani uchun muammo emas,
-- faqat kelajakda muallifni ko'rsatish imkoniyati uchun qo'shildi.
-- "events.created_by" esa manaviyat/page.tsx tomonidan to'liq
-- to'ldiriladi va shu SQL fayl aynan shu ustunni yaratadi.
