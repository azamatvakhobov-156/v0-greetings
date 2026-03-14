// O'quvchi
export interface Student {
  id: string
  fullName: string
  classId: string
  className: string
  attendance: number
  averageGrade: number
  riskLevel: 'low' | 'medium' | 'high'
  phone?: string
  parentPhone?: string
  address?: string
  birthDate?: string
}

// Xodim
export interface Staff {
  id: string
  fullName: string
  position: string
  department: string
  subject?: string
  phone: string
  email?: string
  startDate: string
  education?: string
  experience?: number
}

// Sinf
export interface Class {
  id: string
  name: string
  grade: number
  section: string
  teacherId: string
  teacherName: string
  studentsCount: number
  averageGrade: number
  attendanceRate: number
}

// Fan
export interface Subject {
  id: string
  name: string
  teacherId: string
  teacherName: string
  hoursPerWeek: number
}

// Dars jadvali elementi
export interface ScheduleItem {
  id: string
  day: number
  period: number
  classId: string
  className: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
  room: string
}

// Davomat
export interface Attendance {
  id: string
  studentId: string
  studentName: string
  classId: string
  date: string
  status: 'present' | 'absent' | 'excused' | 'late'
  note?: string
}

// Baho
export interface Grade {
  id: string
  studentId: string
  studentName: string
  subjectId: string
  subjectName: string
  type: 'daily' | 'homework' | 'test' | 'quarterly' | 'final'
  value: number
  maxValue: number
  date: string
  quarter: 1 | 2 | 3 | 4
}

// AI Insight
export interface AIInsight {
  id: string
  type: 'warning' | 'success' | 'info' | 'action'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: 'attendance' | 'performance' | 'behavior' | 'recommendation'
  relatedStudents?: string[]
  relatedClasses?: string[]
  createdAt: string
}

// Tadbir
export interface Event {
  id: string
  title: string
  description: string
  date: string
  time?: string
  type: 'academic' | 'cultural' | 'sports' | 'meeting' | 'holiday'
  participants?: string[]
}

// Intizom holati
export interface DisciplineRecord {
  id: string
  studentId: string
  studentName: string
  type: 'warning' | 'reward' | 'penalty'
  reason: string
  date: string
  issuedBy: string
}

// Statistika kartasi uchun
export interface StatCardData {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: string
  trend?: 'up' | 'down' | 'neutral'
}

// Navigatsiya elementi
export interface NavItem {
  title: string
  url: string
  icon: string
  badge?: number
  children?: NavItem[]
}

// Foydalanuvchi
export interface User {
  id: string
  fullName: string
  email: string
  role: 'admin' | 'teacher' | 'director'
  avatar?: string
}
