export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'director' | 'teacher'
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'admin' | 'director' | 'teacher'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'director' | 'teacher'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          grade: number
          section: string
          teacher_id: string | null
          student_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          grade: number
          section: string
          teacher_id?: string | null
          student_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          grade?: number
          section?: string
          teacher_id?: string | null
          student_count?: number
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          head_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          head_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          head_id?: string | null
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          full_name: string
          birth_date: string | null
          gender: 'male' | 'female' | null
          class_id: string | null
          parent_name: string | null
          parent_phone: string | null
          address: string | null
          photo_url: string | null
          status: 'active' | 'inactive' | 'graduated' | 'transferred'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          birth_date?: string | null
          gender?: 'male' | 'female' | null
          class_id?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          address?: string | null
          photo_url?: string | null
          status?: 'active' | 'inactive' | 'graduated' | 'transferred'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          birth_date?: string | null
          gender?: 'male' | 'female' | null
          class_id?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          address?: string | null
          photo_url?: string | null
          status?: 'active' | 'inactive' | 'graduated' | 'transferred'
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          profile_id: string | null
          department_id: string | null
          full_name: string
          position: string
          hire_date: string | null
          salary: number | null
          education: string | null
          experience_years: number | null
          phone: string | null
          status: 'active' | 'on_leave' | 'terminated'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          department_id?: string | null
          full_name: string
          position: string
          hire_date?: string | null
          salary?: number | null
          education?: string | null
          experience_years?: number | null
          phone?: string | null
          status?: 'active' | 'on_leave' | 'terminated'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          department_id?: string | null
          full_name?: string
          position?: string
          hire_date?: string | null
          salary?: number | null
          education?: string | null
          experience_years?: number | null
          phone?: string | null
          status?: 'active' | 'on_leave' | 'terminated'
          created_at?: string
          updated_at?: string
        }
      }
      student_attendance: {
        Row: {
          id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused'
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late' | 'excused'
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
      }
      staff_attendance: {
        Row: {
          id: string
          staff_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused' | 'on_leave'
          check_in_time: string | null
          check_out_time: string | null
          notes: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          date: string
          status: 'present' | 'absent' | 'late' | 'excused' | 'on_leave'
          check_in_time?: string | null
          check_out_time?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late' | 'excused' | 'on_leave'
          check_in_time?: string | null
          check_out_time?: string | null
          notes?: string | null
          recorded_by?: string | null
          created_at?: string
        }
      }
      schedule: {
        Row: {
          id: string
          class_id: string
          subject_id: string
          teacher_id: string | null
          day_of_week: number
          lesson_number: number
          start_time: string
          end_time: string
          room: string | null
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          subject_id: string
          teacher_id?: string | null
          day_of_week: number
          lesson_number: number
          start_time: string
          end_time: string
          room?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          subject_id?: string
          teacher_id?: string | null
          day_of_week?: number
          lesson_number?: number
          start_time?: string
          end_time?: string
          room?: string | null
          created_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          subject_id: string
          teacher_id: string | null
          grade_type: 'summative_1' | 'summative_2' | 'summative_3' | 'summative_4' | 'final'
          score: number
          max_score: number
          quarter: number | null
          academic_year: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          subject_id: string
          teacher_id?: string | null
          grade_type: 'summative_1' | 'summative_2' | 'summative_3' | 'summative_4' | 'final'
          score: number
          max_score?: number
          quarter?: number | null
          academic_year?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          subject_id?: string
          teacher_id?: string | null
          grade_type?: 'summative_1' | 'summative_2' | 'summative_3' | 'summative_4' | 'final'
          score?: number
          max_score?: number
          quarter?: number | null
          academic_year?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: 'meeting' | 'competition' | 'ceremony' | 'training' | 'other'
          start_date: string
          end_date: string | null
          location: string | null
          organizer_id: string | null
          status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type: 'meeting' | 'competition' | 'ceremony' | 'training' | 'other'
          start_date: string
          end_date?: string | null
          location?: string | null
          organizer_id?: string | null
          status?: 'planned' | 'ongoing' | 'completed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_type?: 'meeting' | 'competition' | 'ceremony' | 'training' | 'other'
          start_date?: string
          end_date?: string | null
          location?: string | null
          organizer_id?: string | null
          status?: 'planned' | 'ongoing' | 'completed' | 'cancelled'
          created_at?: string
        }
      }
      discipline_records: {
        Row: {
          id: string
          student_id: string
          incident_type: 'warning' | 'violation' | 'achievement' | 'note'
          description: string
          action_taken: string | null
          recorded_by: string | null
          incident_date: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          incident_type: 'warning' | 'violation' | 'achievement' | 'note'
          description: string
          action_taken?: string | null
          recorded_by?: string | null
          incident_date: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          incident_type?: 'warning' | 'violation' | 'achievement' | 'note'
          description?: string
          action_taken?: string | null
          recorded_by?: string | null
          incident_date?: string
          created_at?: string
        }
      }
      curriculum: {
        Row: {
          id: string
          subject_id: string
          class_id: string
          title: string
          description: string | null
          hours_per_week: number | null
          academic_year: string | null
          teacher_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          class_id: string
          title: string
          description?: string | null
          hours_per_week?: number | null
          academic_year?: string | null
          teacher_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          class_id?: string
          title?: string
          description?: string | null
          hours_per_week?: number | null
          academic_year?: string | null
          teacher_id?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Profile = Tables<'profiles'>
export type Class = Tables<'classes'>
export type Subject = Tables<'subjects'>
export type Department = Tables<'departments'>
export type Student = Tables<'students'>
export type Staff = Tables<'staff'>
export type StudentAttendance = Tables<'student_attendance'>
export type StaffAttendance = Tables<'staff_attendance'>
export type Schedule = Tables<'schedule'>
export type Grade = Tables<'grades'>
export type Event = Tables<'events'>
export type DisciplineRecord = Tables<'discipline_records'>
export type Curriculum = Tables<'curriculum'>
