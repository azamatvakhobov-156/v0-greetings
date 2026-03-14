import type {
  Student,
  Staff,
  Class,
  Subject,
  ScheduleItem,
  Attendance,
  Grade,
  AIInsight,
  Event,
  DisciplineRecord,
  StatCardData,
  User,
} from './types'

// Joriy foydalanuvchi
export const currentUser: User = {
  id: '1',
  fullName: 'Abdullayev Shavkat',
  email: 'director@maktab.uz',
  role: 'director',
  avatar: undefined,
}

// Sinflar
export const classes: Class[] = [
  { id: '1', name: '5-A', grade: 5, section: 'A', teacherId: '1', teacherName: 'Karimova Dilnoza', studentsCount: 28, averageGrade: 4.2, attendanceRate: 94 },
  { id: '2', name: '5-B', grade: 5, section: 'B', teacherId: '2', teacherName: 'Rahimov Sardor', studentsCount: 26, averageGrade: 3.9, attendanceRate: 91 },
  { id: '3', name: '6-A', grade: 6, section: 'A', teacherId: '3', teacherName: 'Toshmatova Nilufar', studentsCount: 30, averageGrade: 4.4, attendanceRate: 96 },
  { id: '4', name: '6-B', grade: 6, section: 'B', teacherId: '4', teacherName: 'Aliyev Jamshid', studentsCount: 27, averageGrade: 3.7, attendanceRate: 89 },
  { id: '5', name: '7-A', grade: 7, section: 'A', teacherId: '5', teacherName: 'Nazarova Madina', studentsCount: 29, averageGrade: 4.1, attendanceRate: 93 },
  { id: '6', name: '7-B', grade: 7, section: 'B', teacherId: '6', teacherName: 'Umarov Bobur', studentsCount: 25, averageGrade: 3.8, attendanceRate: 90 },
  { id: '7', name: '8-A', grade: 8, section: 'A', teacherId: '7', teacherName: 'Qodirova Zulayho', studentsCount: 31, averageGrade: 4.3, attendanceRate: 95 },
  { id: '8', name: '8-B', grade: 8, section: 'B', teacherId: '8', teacherName: 'Saidov Akmal', studentsCount: 28, averageGrade: 3.6, attendanceRate: 87 },
  { id: '9', name: '9-A', grade: 9, section: 'A', teacherId: '9', teacherName: 'Ergasheva Saida', studentsCount: 32, averageGrade: 4.5, attendanceRate: 97 },
  { id: '10', name: '9-B', grade: 9, section: 'B', teacherId: '10', teacherName: 'Yusupov Farrux', studentsCount: 29, averageGrade: 4.0, attendanceRate: 92 },
]

// O'quvchilar
export const students: Student[] = [
  { id: '1', fullName: 'Aliyev Jasur', classId: '1', className: '5-A', attendance: 96, averageGrade: 4.5, riskLevel: 'low' },
  { id: '2', fullName: 'Bekmurodova Nilufar', classId: '1', className: '5-A', attendance: 92, averageGrade: 4.8, riskLevel: 'low' },
  { id: '3', fullName: 'Toshmatov Sardor', classId: '1', className: '5-A', attendance: 78, averageGrade: 3.2, riskLevel: 'high' },
  { id: '4', fullName: 'Qodirova Madina', classId: '1', className: '5-A', attendance: 88, averageGrade: 3.9, riskLevel: 'medium' },
  { id: '5', fullName: 'Rahimov Shoxrux', classId: '2', className: '5-B', attendance: 94, averageGrade: 4.3, riskLevel: 'low' },
  { id: '6', fullName: 'Karimova Dilbar', classId: '2', className: '5-B', attendance: 72, averageGrade: 2.8, riskLevel: 'high' },
  { id: '7', fullName: 'Umarov Bekzod', classId: '3', className: '6-A', attendance: 98, averageGrade: 4.9, riskLevel: 'low' },
  { id: '8', fullName: 'Nazarova Gulnora', classId: '3', className: '6-A', attendance: 85, averageGrade: 3.5, riskLevel: 'medium' },
  { id: '9', fullName: 'Saidov Javohir', classId: '4', className: '6-B', attendance: 68, averageGrade: 2.5, riskLevel: 'high' },
  { id: '10', fullName: 'Ergasheva Mohira', classId: '4', className: '6-B', attendance: 91, averageGrade: 4.1, riskLevel: 'low' },
  { id: '11', fullName: 'Yusupov Azizbek', classId: '5', className: '7-A', attendance: 95, averageGrade: 4.4, riskLevel: 'low' },
  { id: '12', fullName: 'Abdullayeva Shahzoda', classId: '5', className: '7-A', attendance: 82, averageGrade: 3.3, riskLevel: 'medium' },
  { id: '13', fullName: 'Mirzayev Umid', classId: '6', className: '7-B', attendance: 75, averageGrade: 2.9, riskLevel: 'high' },
  { id: '14', fullName: 'Xolmatova Feruza', classId: '6', className: '7-B', attendance: 93, averageGrade: 4.2, riskLevel: 'low' },
  { id: '15', fullName: 'Normatov Dilshod', classId: '7', className: '8-A', attendance: 97, averageGrade: 4.7, riskLevel: 'low' },
]

// Xodimlar
export const staff: Staff[] = [
  { id: '1', fullName: 'Karimova Dilnoza', position: "Sinf rahbari", department: "O'quv", subject: 'Matematika', phone: '+998901234567', startDate: '2018-09-01', education: 'Oliy', experience: 7 },
  { id: '2', fullName: 'Rahimov Sardor', position: "Sinf rahbari", department: "O'quv", subject: 'Fizika', phone: '+998901234568', startDate: '2019-09-01', education: 'Oliy', experience: 6 },
  { id: '3', fullName: 'Toshmatova Nilufar', position: "Sinf rahbari", department: "O'quv", subject: "O'zbek tili", phone: '+998901234569', startDate: '2015-09-01', education: 'Oliy', experience: 10 },
  { id: '4', fullName: 'Aliyev Jamshid', position: "Sinf rahbari", department: "O'quv", subject: 'Ingliz tili', phone: '+998901234570', startDate: '2020-09-01', education: 'Oliy', experience: 5 },
  { id: '5', fullName: 'Nazarova Madina', position: "Sinf rahbari", department: "O'quv", subject: 'Biologiya', phone: '+998901234571', startDate: '2017-09-01', education: 'Oliy', experience: 8 },
  { id: '6', fullName: 'Umarov Bobur', position: "Sinf rahbari", department: "O'quv", subject: 'Kimyo', phone: '+998901234572', startDate: '2021-09-01', education: 'Oliy', experience: 4 },
  { id: '7', fullName: 'Qodirova Zulayho', position: "Sinf rahbari", department: "O'quv", subject: 'Tarix', phone: '+998901234573', startDate: '2016-09-01', education: 'Oliy', experience: 9 },
  { id: '8', fullName: 'Saidov Akmal', position: "Sinf rahbari", department: "O'quv", subject: 'Geografiya', phone: '+998901234574', startDate: '2019-09-01', education: 'Oliy', experience: 6 },
  { id: '9', fullName: 'Ergasheva Saida', position: "Sinf rahbari", department: "O'quv", subject: 'Adabiyot', phone: '+998901234575', startDate: '2014-09-01', education: 'Oliy', experience: 11 },
  { id: '10', fullName: 'Yusupov Farrux', position: "Sinf rahbari", department: "O'quv", subject: 'Informatika', phone: '+998901234576', startDate: '2022-09-01', education: 'Oliy', experience: 3 },
  { id: '11', fullName: 'Abdullayev Shavkat', position: 'Direktor', department: 'Rahbariyat', phone: '+998901234500', startDate: '2010-09-01', education: 'Oliy', experience: 15 },
  { id: '12', fullName: "Mahmudova Gulchehra", position: "O'quv ishlari bo'yicha direktor o'rinbosari", department: 'Rahbariyat', phone: '+998901234501', startDate: '2012-09-01', education: 'Oliy', experience: 13 },
  { id: '13', fullName: 'Rustamov Anvar', position: "Ma'naviyat bo'limi boshlig'i", department: "Ma'naviyat", phone: '+998901234502', startDate: '2015-09-01', education: 'Oliy', experience: 10 },
  { id: '14', fullName: 'Xoliqova Zarina', position: 'Kadrlar inspektori', department: 'Kadrlar', phone: '+998901234503', startDate: '2018-09-01', education: 'Oliy', experience: 7 },
  { id: '15', fullName: 'Tojiyev Botir', position: 'Xo\'jalik mudiri', department: 'Xo\'jalik', phone: '+998901234504', startDate: '2016-09-01', education: "O'rta maxsus", experience: 9 },
]

// Fanlar
export const subjects: Subject[] = [
  { id: '1', name: 'Matematika', teacherId: '1', teacherName: 'Karimova Dilnoza', hoursPerWeek: 6 },
  { id: '2', name: 'Fizika', teacherId: '2', teacherName: 'Rahimov Sardor', hoursPerWeek: 4 },
  { id: '3', name: "O'zbek tili", teacherId: '3', teacherName: 'Toshmatova Nilufar', hoursPerWeek: 5 },
  { id: '4', name: 'Ingliz tili', teacherId: '4', teacherName: 'Aliyev Jamshid', hoursPerWeek: 4 },
  { id: '5', name: 'Biologiya', teacherId: '5', teacherName: 'Nazarova Madina', hoursPerWeek: 3 },
  { id: '6', name: 'Kimyo', teacherId: '6', teacherName: 'Umarov Bobur', hoursPerWeek: 3 },
  { id: '7', name: 'Tarix', teacherId: '7', teacherName: 'Qodirova Zulayho', hoursPerWeek: 3 },
  { id: '8', name: 'Geografiya', teacherId: '8', teacherName: 'Saidov Akmal', hoursPerWeek: 2 },
  { id: '9', name: 'Adabiyot', teacherId: '9', teacherName: 'Ergasheva Saida', hoursPerWeek: 4 },
  { id: '10', name: 'Informatika', teacherId: '10', teacherName: 'Yusupov Farrux', hoursPerWeek: 2 },
]

// Dars jadvali
export const schedule: ScheduleItem[] = [
  // Dushanba - 5-A sinf
  { id: '1', day: 1, period: 1, classId: '1', className: '5-A', subjectId: '1', subjectName: 'Matematika', teacherId: '1', teacherName: 'Karimova Dilnoza', room: '101' },
  { id: '2', day: 1, period: 2, classId: '1', className: '5-A', subjectId: '3', subjectName: "O'zbek tili", teacherId: '3', teacherName: 'Toshmatova Nilufar', room: '102' },
  { id: '3', day: 1, period: 3, classId: '1', className: '5-A', subjectId: '4', subjectName: 'Ingliz tili', teacherId: '4', teacherName: 'Aliyev Jamshid', room: '103' },
  { id: '4', day: 1, period: 4, classId: '1', className: '5-A', subjectId: '5', subjectName: 'Biologiya', teacherId: '5', teacherName: 'Nazarova Madina', room: '104' },
  // Seshanba - 5-A sinf
  { id: '5', day: 2, period: 1, classId: '1', className: '5-A', subjectId: '2', subjectName: 'Fizika', teacherId: '2', teacherName: 'Rahimov Sardor', room: '105' },
  { id: '6', day: 2, period: 2, classId: '1', className: '5-A', subjectId: '1', subjectName: 'Matematika', teacherId: '1', teacherName: 'Karimova Dilnoza', room: '101' },
  { id: '7', day: 2, period: 3, classId: '1', className: '5-A', subjectId: '7', subjectName: 'Tarix', teacherId: '7', teacherName: 'Qodirova Zulayho', room: '106' },
  { id: '8', day: 2, period: 4, classId: '1', className: '5-A', subjectId: '10', subjectName: 'Informatika', teacherId: '10', teacherName: 'Yusupov Farrux', room: '107' },
  // Chorshanba - 5-A sinf
  { id: '9', day: 3, period: 1, classId: '1', className: '5-A', subjectId: '3', subjectName: "O'zbek tili", teacherId: '3', teacherName: 'Toshmatova Nilufar', room: '102' },
  { id: '10', day: 3, period: 2, classId: '1', className: '5-A', subjectId: '6', subjectName: 'Kimyo', teacherId: '6', teacherName: 'Umarov Bobur', room: '108' },
  { id: '11', day: 3, period: 3, classId: '1', className: '5-A', subjectId: '1', subjectName: 'Matematika', teacherId: '1', teacherName: 'Karimova Dilnoza', room: '101' },
  { id: '12', day: 3, period: 4, classId: '1', className: '5-A', subjectId: '9', subjectName: 'Adabiyot', teacherId: '9', teacherName: 'Ergasheva Saida', room: '109' },
]

// AI Insights
export const aiInsights: AIInsight[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Past davomat ogohlantirishi',
    description: "6-B sinfida 5 nafar o'quvchi ketma-ket 3 kundan ortiq darsga qatnashmadi. Ota-onalar bilan bog'lanish tavsiya etiladi.",
    priority: 'high',
    category: 'attendance',
    relatedClasses: ['4'],
    createdAt: '2024-03-14',
  },
  {
    id: '2',
    type: 'action',
    title: "O'zlashtirish pasayishi aniqlandi",
    description: "8-B sinfida matematika fanidan o'rtacha ball oxirgi oyda 15% pasaydi. Qo'shimcha mashg'ulotlar o'tkazish tavsiya etiladi.",
    priority: 'high',
    category: 'performance',
    relatedClasses: ['8'],
    createdAt: '2024-03-14',
  },
  {
    id: '3',
    type: 'success',
    title: 'A\'lo natija',
    description: "9-A sinfi viloyat olimpiadasida 3 ta birinchi o'rin egalladi. Taqdirlash tadbiri o'tkazish mumkin.",
    priority: 'medium',
    category: 'performance',
    relatedClasses: ['9'],
    createdAt: '2024-03-13',
  },
  {
    id: '4',
    type: 'info',
    title: 'Haftalik tahlil tayyor',
    description: "Barcha sinflar bo'yicha haftalik o'zlashtirish va davomat tahlili tayyor. Hisobotni ko'rish uchun bosing.",
    priority: 'low',
    category: 'recommendation',
    createdAt: '2024-03-13',
  },
  {
    id: '5',
    type: 'warning',
    title: 'Xavf guruhidagi o\'quvchilar',
    description: "3 nafar o'quvchi o'zlashtirish va davomat bo'yicha xavf guruhiga tushdi. Individual yondashuv talab etiladi.",
    priority: 'high',
    category: 'recommendation',
    relatedStudents: ['3', '6', '9'],
    createdAt: '2024-03-14',
  },
]

// Tadbirlar
export const events: Event[] = [
  { id: '1', title: 'Navruz bayrami', description: "Maktab bog'chasida bayram tadbiri", date: '2024-03-21', time: '10:00', type: 'cultural' },
  { id: '2', title: 'Ota-onalar yig\'ilishi', description: "II chorak natijalari muhokamasi", date: '2024-03-25', time: '18:00', type: 'meeting' },
  { id: '3', title: 'Sport musobaqasi', description: "Maktablararo voleybol musobaqasi", date: '2024-03-28', time: '09:00', type: 'sports' },
  { id: '4', title: 'Ochiq dars', description: "Matematika fanidan viloyat miqyosidagi ochiq dars", date: '2024-04-02', time: '11:00', type: 'academic' },
  { id: '5', title: "Bahorgi ta'til", description: "O'quv yili davomidagi ta'til kunlari", date: '2024-03-30', type: 'holiday' },
]

// Intizom yozuvlari
export const disciplineRecords: DisciplineRecord[] = [
  { id: '1', studentId: '3', studentName: 'Toshmatov Sardor', type: 'warning', reason: "Darsga kechikish (3 marta)", date: '2024-03-10', issuedBy: 'Karimova Dilnoza' },
  { id: '2', studentId: '7', studentName: 'Umarov Bekzod', type: 'reward', reason: "Olimpiadada g'olib bo'lgani uchun", date: '2024-03-08', issuedBy: 'Abdullayev Shavkat' },
  { id: '3', studentId: '9', studentName: 'Saidov Javohir', type: 'penalty', reason: "Maktab mulkiga zarar yetkazish", date: '2024-03-05', issuedBy: 'Rustamov Anvar' },
]

// Dashboard statistika kartalari
export const dashboardStats: StatCardData[] = [
  { title: "Jami o'quvchilar", value: 285, change: 12, changeLabel: "o'tgan oyga nisbatan", icon: 'users', trend: 'up' },
  { title: 'Bugungi davomat', value: '94%', change: 2, changeLabel: "o'tgan haftaga nisbatan", icon: 'calendar-check', trend: 'up' },
  { title: "O'rtacha o'zlashtirish", value: 4.1, change: -0.2, changeLabel: "o'tgan chorakka nisbatan", icon: 'graduation-cap', trend: 'down' },
  { title: 'Xodimlar soni', value: 45, change: 3, changeLabel: "yangi xodimlar", icon: 'briefcase', trend: 'up' },
]

// Haftalik davomat ma'lumotlari (grafik uchun)
export const weeklyAttendanceData = [
  { day: 'Dush', present: 268, absent: 17 },
  { day: 'Sesh', present: 272, absent: 13 },
  { day: 'Chor', present: 265, absent: 20 },
  { day: 'Pay', present: 270, absent: 15 },
  { day: 'Jum', present: 275, absent: 10 },
  { day: 'Shan', present: 260, absent: 25 },
]

// Sinflar bo'yicha o'zlashtirish (grafik uchun)
export const classPerformanceData = [
  { class: '5-A', average: 4.2 },
  { class: '5-B', average: 3.9 },
  { class: '6-A', average: 4.4 },
  { class: '6-B', average: 3.7 },
  { class: '7-A', average: 4.1 },
  { class: '7-B', average: 3.8 },
  { class: '8-A', average: 4.3 },
  { class: '8-B', average: 3.6 },
  { class: '9-A', average: 4.5 },
  { class: '9-B', average: 4.0 },
]

// Fanlar bo'yicha natijalar (radar chart uchun)
export const subjectPerformanceData = [
  { subject: 'Matematika', score: 78 },
  { subject: 'Fizika', score: 72 },
  { subject: "O'zbek tili", score: 85 },
  { subject: 'Ingliz tili', score: 68 },
  { subject: 'Biologiya', score: 82 },
  { subject: 'Kimyo', score: 75 },
  { subject: 'Tarix', score: 88 },
  { subject: 'Informatika', score: 80 },
]

// Oylik davomat tendensiyasi
export const monthlyAttendanceData = [
  { month: 'Sen', rate: 96 },
  { month: 'Okt', rate: 94 },
  { month: 'Noy', rate: 92 },
  { month: 'Dek', rate: 88 },
  { month: 'Yan', rate: 91 },
  { month: 'Fev', rate: 93 },
  { month: 'Mar', rate: 94 },
]

// Kunlar nomlari
export const dayNames = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

// Dars vaqtlari
export const periodTimes = [
  { period: 1, start: '08:00', end: '08:45' },
  { period: 2, start: '08:55', end: '09:40' },
  { period: 3, start: '09:50', end: '10:35' },
  { period: 4, start: '10:55', end: '11:40' },
  { period: 5, start: '11:50', end: '12:35' },
  { period: 6, start: '12:45', end: '13:30' },
]
