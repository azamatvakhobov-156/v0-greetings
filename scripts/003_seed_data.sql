-- Boshlang'ich ma'lumotlar

-- Bo'limlar
INSERT INTO public.departments (name, description) VALUES
  ('Rahbariyat', 'Maktab rahbariyati'),
  ('O''quv bo''limi', 'Ta''lim jarayonini boshqarish'),
  ('Ma''naviyat bo''limi', 'Tarbiyaviy ishlar'),
  ('Kadrlar bo''limi', 'Xodimlarni boshqarish'),
  ('Moliya bo''limi', 'Moliyaviy masalalar'),
  ('Texnik xizmat', 'Texnik ta''minot')
ON CONFLICT (name) DO NOTHING;

-- Fanlar
INSERT INTO public.subjects (name, description) VALUES
  ('Ona tili', 'O''zbek tili va adabiyoti'),
  ('Matematika', 'Matematika asoslari'),
  ('Algebra', 'Algebra kursi'),
  ('Geometriya', 'Geometriya kursi'),
  ('Fizika', 'Fizika asoslari'),
  ('Kimyo', 'Kimyo asoslari'),
  ('Biologiya', 'Biologiya asoslari'),
  ('Tarix', 'O''zbekiston va jahon tarixi'),
  ('Geografiya', 'Geografiya asoslari'),
  ('Ingliz tili', 'Ingliz tili kursi'),
  ('Rus tili', 'Rus tili kursi'),
  ('Informatika', 'Axborot texnologiyalari'),
  ('Jismoniy tarbiya', 'Sport va jismoniy mashqlar'),
  ('Musiqa', 'Musiqa san''ati'),
  ('Tasviriy san''at', 'Rasm chizish'),
  ('Texnologiya', 'Mehnat ta''limi')
ON CONFLICT (name) DO NOTHING;

-- Sinflar
INSERT INTO public.classes (name, grade, section, student_count) VALUES
  ('1-A', 1, 'A', 28),
  ('1-B', 1, 'B', 26),
  ('2-A', 2, 'A', 30),
  ('2-B', 2, 'B', 29),
  ('3-A', 3, 'A', 27),
  ('3-B', 3, 'B', 28),
  ('4-A', 4, 'A', 31),
  ('4-B', 4, 'B', 30),
  ('5-A', 5, 'A', 32),
  ('5-B', 5, 'B', 31),
  ('6-A', 6, 'A', 29),
  ('6-B', 6, 'B', 30),
  ('7-A', 7, 'A', 28),
  ('7-B', 7, 'B', 27),
  ('8-A', 8, 'A', 26),
  ('8-B', 8, 'B', 25),
  ('9-A', 9, 'A', 24),
  ('9-B', 9, 'B', 23),
  ('10-A', 10, 'A', 22),
  ('10-B', 10, 'B', 21),
  ('11-A', 11, 'A', 20),
  ('11-B', 11, 'B', 19)
ON CONFLICT (name) DO NOTHING;
