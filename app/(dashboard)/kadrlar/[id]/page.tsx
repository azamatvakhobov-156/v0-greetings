"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  CalendarIcon,
  Briefcase,
  GraduationCap,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  ClipboardList,
  Users,
  Check,
  X,
  Save,
  Plus,
  Trash2,
  Calculator,
  BookOpen,
} from "lucide-react"

interface Staff {
  id: string
  full_name: string
  position: string
  department_id: string | null
  phone: string | null
  status: string
  hire_date: string | null
  staff_type: "technical" | "pedagogue" | "management"
  subject_id: string | null
  education: string | null
  experience_years: number | null
  salary: number | null
  created_at: string
  departments?: { name: string } | null
  subjects?: { name: string } | null
}

interface Task {
  id: string
  title: string
  description: string | null
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  due_date: string | null
  created_at: string
}

interface StaffAttendance {
  id: string
  date: string
  status: "present" | "absent" | "late" | "excused" | "on_leave"
  check_in_time: string | null
  check_out_time: string | null
  notes: string | null
}

interface ClassInfo {
  id: string
  name: string
  grade: number
  section: string
}

interface StudentInfo {
  id: string
  full_name: string
  class_id: string | null
  classes?: { name: string } | null
}

interface StudentAttendanceRecord {
  id: string
  student_id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  notes: string | null
}

interface AssessmentTask {
  id: string
  name: string
  maxScore: number
}

interface StudentScore {
  studentId: string
  scores: Record<string, number> // taskId -> score
}

const staffTypeLabels: Record<string, string> = {
  technical: "Texnik xodim",
  pedagogue: "Pedagog",
  management: "Rahbariyat"
}

const priorityLabels: Record<string, string> = {
  low: "Past",
  medium: "O'rta",
  high: "Yuqori",
  urgent: "Shoshilinch"
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-yellow-500/20 text-yellow-400",
  urgent: "bg-red-500/20 text-red-400"
}

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  in_progress: "Bajarilmoqda",
  completed: "Bajarildi",
  cancelled: "Bekor qilindi"
}

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400"
}

const attendanceStatusLabels: Record<string, string> = {
  present: "Keldi",
  absent: "Kelmadi",
  late: "Kechikdi",
  excused: "Sababli",
  on_leave: "Ta'tilda"
}

const attendanceStatusColors: Record<string, string> = {
  present: "bg-green-500/20 text-green-400",
  absent: "bg-red-500/20 text-red-400",
  late: "bg-yellow-500/20 text-yellow-400",
  excused: "bg-blue-500/20 text-blue-400",
  on_leave: "bg-purple-500/20 text-purple-400"
}

const studentAttendanceStatusLabels: Record<string, string> = {
  present: "Keldi",
  absent: "Kelmadi",
  late: "Kechikdi",
  excused: "Sababli"
}

const studentAttendanceStatusColors: Record<string, string> = {
  present: "bg-green-500/20 text-green-400",
  absent: "bg-red-500/20 text-red-400",
  late: "bg-yellow-500/20 text-yellow-400",
  excused: "bg-blue-500/20 text-blue-400"
}

export default function StaffProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [attendance, setAttendance] = useState<StaffAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("malumotlar")
  
  // Student attendance states (for pedagogue only)
  const [teacherClasses, setTeacherClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [studentAttendance, setStudentAttendance] = useState<Record<string, "present" | "absent" | "late" | "excused">>({})
  const [existingAttendance, setExistingAttendance] = useState<StudentAttendanceRecord[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  
  // Summative assessment states (for pedagogue only)
  const [assessmentType, setAssessmentType] = useState<"bsb" | "chsb">("bsb")
  const [assessmentQuarter, setAssessmentQuarter] = useState<string>("1")
  const [assessmentClass, setAssessmentClass] = useState<string>("")
  const [assessmentStudents, setAssessmentStudents] = useState<StudentInfo[]>([])
  const [assessmentTasks, setAssessmentTasks] = useState<AssessmentTask[]>([
    { id: "1", name: "1-topshiriq", maxScore: 10 }
  ])
  const [studentScores, setStudentScores] = useState<Record<string, Record<string, number>>>({})
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false)
  const [isSavingAssessment, setIsSavingAssessment] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchStaffData()
    }
  }, [params.id])

  const fetchStaffData = async () => {
    setIsLoading(true)
    
    // Fetch staff details
    const { data: staffData } = await supabase
      .from("staff")
      .select("*, departments(name), subjects(name)")
      .eq("id", params.id)
      .single()
    
    if (staffData) {
      setStaff(staffData)
      
      // Fetch tasks assigned to this staff
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", params.id)
        .order("created_at", { ascending: false })
        .limit(10)
      
      if (tasksData) setTasks(tasksData)
      
      // Fetch attendance records
      const { data: attendanceData } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("staff_id", params.id)
        .order("date", { ascending: false })
        .limit(30)
      
      if (attendanceData) setAttendance(attendanceData)
      
      // If pedagogue, fetch classes they teach
      if (staffData.staff_type === "pedagogue") {
        const { data: scheduleData } = await supabase
          .from("schedule")
          .select("class_id, classes(id, name, grade, section)")
          .eq("teacher_id", params.id)
        
        if (scheduleData) {
          const uniqueClasses = scheduleData
            .filter((s: { classes: ClassInfo | null }) => s.classes)
            .map((s: { classes: ClassInfo | null }) => s.classes as ClassInfo)
            .filter((value, index, self) => 
              index === self.findIndex((t) => t.id === value.id)
            )
          setTeacherClasses(uniqueClasses)
        }
      }
    }
    
    setIsLoading(false)
  }

  // Fetch students when class is selected
  const fetchStudentsForClass = async (classId: string) => {
    setIsLoadingStudents(true)
    const { data } = await supabase
      .from("students")
      .select("id, full_name, class_id, classes(name)")
      .eq("class_id", classId)
      .eq("status", "active")
      .order("full_name")
    
    if (data) {
      setStudents(data)
      // Initialize attendance with "present" for all students
      const initialAttendance: Record<string, "present" | "absent" | "late" | "excused"> = {}
      data.forEach(s => {
        initialAttendance[s.id] = "present"
      })
      
      // Check for existing attendance records for this date
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const { data: existingData } = await supabase
        .from("student_attendance")
        .select("*")
        .eq("date", dateStr)
        .in("student_id", data.map(s => s.id))
      
      if (existingData && existingData.length > 0) {
        setExistingAttendance(existingData)
        existingData.forEach(record => {
          initialAttendance[record.student_id] = record.status
        })
      } else {
        setExistingAttendance([])
      }
      
      setStudentAttendance(initialAttendance)
    }
    setIsLoadingStudents(false)
  }

  // Handle class selection
  useEffect(() => {
    if (selectedClass) {
      fetchStudentsForClass(selectedClass)
    }
  }, [selectedClass, selectedDate])

  // Save student attendance
  const saveStudentAttendance = async () => {
    if (!selectedClass || students.length === 0) return
    
    setIsSaving(true)
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    
    // Delete existing records for this date and these students
    if (existingAttendance.length > 0) {
      await supabase
        .from("student_attendance")
        .delete()
        .eq("date", dateStr)
        .in("student_id", students.map(s => s.id))
    }
    
    // Insert new records
    const records = students.map(student => ({
      student_id: student.id,
      date: dateStr,
      status: studentAttendance[student.id] || "present",
      recorded_by: staff?.id
    }))
    
    await supabase.from("student_attendance").insert(records)
    
    // Refresh existing attendance
    const { data: newExisting } = await supabase
      .from("student_attendance")
      .select("*")
      .eq("date", dateStr)
      .in("student_id", students.map(s => s.id))
    
    if (newExisting) setExistingAttendance(newExisting)
    
    setIsSaving(false)
  }

  // Fetch students for assessment when class is selected
  const fetchStudentsForAssessment = async (classId: string) => {
    setIsLoadingAssessment(true)
    const { data } = await supabase
      .from("students")
      .select("id, full_name, class_id, classes(name)")
      .eq("class_id", classId)
      .eq("status", "active")
      .order("full_name")
    
    if (data) {
      setAssessmentStudents(data)
      // Initialize scores with 0 for all students and tasks
      const initialScores: Record<string, Record<string, number>> = {}
      data.forEach(s => {
        initialScores[s.id] = {}
        assessmentTasks.forEach(task => {
          initialScores[s.id][task.id] = 0
        })
      })
      setStudentScores(initialScores)
    }
    setIsLoadingAssessment(false)
  }

  // Handle assessment class selection
  useEffect(() => {
    if (assessmentClass) {
      fetchStudentsForAssessment(assessmentClass)
    }
  }, [assessmentClass])

  // Add new task
  const addTask = () => {
    const newId = String(assessmentTasks.length + 1)
    const newTask: AssessmentTask = {
      id: newId,
      name: `${assessmentTasks.length + 1}-topshiriq`,
      maxScore: 10
    }
    setAssessmentTasks([...assessmentTasks, newTask])
    
    // Add this task to all student scores
    const updatedScores = { ...studentScores }
    Object.keys(updatedScores).forEach(studentId => {
      updatedScores[studentId][newId] = 0
    })
    setStudentScores(updatedScores)
  }

  // Remove task
  const removeTask = (taskId: string) => {
    if (assessmentTasks.length <= 1) return
    setAssessmentTasks(assessmentTasks.filter(t => t.id !== taskId))
    
    // Remove this task from all student scores
    const updatedScores = { ...studentScores }
    Object.keys(updatedScores).forEach(studentId => {
      delete updatedScores[studentId][taskId]
    })
    setStudentScores(updatedScores)
  }

  // Update task
  const updateTask = (taskId: string, field: "name" | "maxScore", value: string | number) => {
    setAssessmentTasks(assessmentTasks.map(t => 
      t.id === taskId ? { ...t, [field]: value } : t
    ))
  }

  // Update student score
  const updateStudentScore = (studentId: string, taskId: string, score: number) => {
    const task = assessmentTasks.find(t => t.id === taskId)
    if (!task) return
    
    // Ensure score doesn't exceed max score
    const validScore = Math.min(Math.max(0, score), task.maxScore)
    
    setStudentScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [taskId]: validScore
      }
    }))
  }

  // Calculate total score for a student
  const calculateTotalScore = (studentId: string) => {
    const scores = studentScores[studentId] || {}
    return Object.values(scores).reduce((sum, score) => sum + score, 0)
  }

  // Calculate max possible score
  const calculateMaxScore = () => {
    return assessmentTasks.reduce((sum, task) => sum + task.maxScore, 0)
  }

  // Calculate percentage
  const calculatePercentage = (studentId: string) => {
    const total = calculateTotalScore(studentId)
    const max = calculateMaxScore()
    if (max === 0) return 0
    return Math.round((total / max) * 100)
  }

  // Get grade based on percentage
  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 86) return { grade: 5, label: "A'lo" }
    if (percentage >= 71) return { grade: 4, label: "Yaxshi" }
    if (percentage >= 56) return { grade: 3, label: "Qoniqarli" }
    return { grade: 2, label: "Qoniqarsiz" }
  }

  // Save assessment
  const saveAssessment = async () => {
    if (!assessmentClass || assessmentStudents.length === 0 || !staff?.subject_id) return
    
    setIsSavingAssessment(true)
    
    const gradeType = assessmentType === "bsb" 
      ? `summative_${assessmentQuarter}` as "summative_1" | "summative_2" | "summative_3" | "summative_4"
      : "final"
    
    // Delete existing grades for this assessment
    await supabase
      .from("grades")
      .delete()
      .eq("subject_id", staff.subject_id)
      .eq("grade_type", gradeType)
      .eq("quarter", parseInt(assessmentQuarter))
      .in("student_id", assessmentStudents.map(s => s.id))
    
    // Insert new grades
    const records = assessmentStudents.map(student => ({
      student_id: student.id,
      subject_id: staff.subject_id,
      teacher_id: staff.id,
      grade_type: gradeType,
      score: calculateTotalScore(student.id),
      max_score: calculateMaxScore(),
      quarter: parseInt(assessmentQuarter),
      academic_year: new Date().getFullYear().toString(),
      notes: `Topshiriqlar: ${assessmentTasks.map(t => `${t.name}(${studentScores[student.id]?.[t.id] || 0}/${t.maxScore})`).join(", ")}`
    }))
    
    await supabase.from("grades").insert(records)
    
    setIsSavingAssessment(false)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const calculateWorkDuration = (hireDate: string | null) => {
    if (!hireDate) return "-"
    const start = new Date(hireDate)
    const now = new Date()
    const years = now.getFullYear() - start.getFullYear()
    const months = now.getMonth() - start.getMonth()
    
    if (years > 0) {
      return `${years} yil ${months > 0 ? months + " oy" : ""}`
    }
    return `${months} oy`
  }

  // Stats
  const completedTasks = tasks.filter(t => t.status === "completed").length
  const activeTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length
  const presentDays = attendance.filter(a => a.status === "present").length
  const totalAttendanceDays = attendance.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Xodim topilmadi</p>
        <Button variant="outline" onClick={() => router.push("/kadrlar")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orqaga qaytish
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/kadrlar")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Xodim profili</h1>
          <p className="text-muted-foreground">Xodim haqida to'liq ma'lumot</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {staff.full_name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-foreground">{staff.full_name}</h2>
                  <Badge className={staff.status === "active" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>
                    {staff.status === "active" ? "Faol" : staff.status === "on_leave" ? "Ta'tilda" : "Nofaol"}
                  </Badge>
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    {staffTypeLabels[staff.staff_type] || staff.staff_type}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground mt-1">{staff.position}</p>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm">
                {staff.departments?.name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{staff.departments.name}</span>
                  </div>
                )}
                {staff.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{staff.phone}</span>
                  </div>
                )}
                {staff.hire_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Ishga kirgan: {formatDate(staff.hire_date)}</span>
                  </div>
                )}
                {staff.subjects?.name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>Fan: {staff.subjects.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{calculateWorkDuration(staff.hire_date)}</p>
                <p className="text-sm text-muted-foreground">Ish staji</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeTasks}</p>
                <p className="text-sm text-muted-foreground">Faol topshiriqlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
                <p className="text-sm text-muted-foreground">Bajarilgan topshiriqlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Davomat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="malumotlar">Ma'lumotlar</TabsTrigger>
          <TabsTrigger value="topshiriqlar">Topshiriqlar</TabsTrigger>
          <TabsTrigger value="davomat">Davomat</TabsTrigger>
          {staff.staff_type === "pedagogue" && (
            <TabsTrigger value="yoklama">O'quvchilar yo'qlama</TabsTrigger>
          )}
          {staff.staff_type === "pedagogue" && (
            <TabsTrigger value="summativ">Summativ baholash</TabsTrigger>
          )}
        </TabsList>

        {/* Ma'lumotlar Tab */}
        <TabsContent value="malumotlar" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Shaxsiy ma'lumotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To'liq ism</span>
                  <span className="font-medium">{staff.full_name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefon</span>
                  <span className="font-medium">{staff.phone || "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Xodim turi</span>
                  <span className="font-medium">{staffTypeLabels[staff.staff_type] || staff.staff_type}</span>
                </div>
                {staff.staff_type === "pedagogue" && staff.subjects?.name && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">O'qitiladigan fan</span>
                      <span className="font-medium">{staff.subjects.name}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Ish ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lavozim</span>
                  <span className="font-medium">{staff.position}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bo'lim</span>
                  <span className="font-medium">{staff.departments?.name || "-"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ishga kirgan sana</span>
                  <span className="font-medium">{formatDate(staff.hire_date)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ish staji</span>
                  <span className="font-medium">{calculateWorkDuration(staff.hire_date)}</span>
                </div>
                {staff.education && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ta'lim</span>
                      <span className="font-medium">{staff.education}</span>
                    </div>
                  </>
                )}
                {staff.experience_years !== null && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tajriba (yil)</span>
                      <span className="font-medium">{staff.experience_years} yil</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Topshiriqlar Tab */}
        <TabsContent value="topshiriqlar" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Topshiriqlar tarixi</CardTitle>
              <CardDescription>So'nggi 10 ta topshiriq</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sarlavha</TableHead>
                    <TableHead>Muhimlik</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Muddat</TableHead>
                    <TableHead>Yaratilgan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <Badge className={priorityColors[task.priority]}>
                          {priorityLabels[task.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.status]}>
                          {statusLabels[task.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatShortDate(task.due_date)}</TableCell>
                      <TableCell>{formatShortDate(task.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Topshiriqlar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Davomat Tab */}
        <TabsContent value="davomat" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Davomat tarixi</CardTitle>
              <CardDescription>So'nggi 30 kunlik davomat</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Kelish vaqti</TableHead>
                    <TableHead>Ketish vaqti</TableHead>
                    <TableHead>Izoh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatShortDate(record.date)}</TableCell>
                      <TableCell>
                        <Badge className={attendanceStatusColors[record.status]}>
                          {attendanceStatusLabels[record.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.check_in_time || "-"}</TableCell>
                      <TableCell>{record.check_out_time || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{record.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {attendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Davomat ma'lumotlari topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* O'quvchilar yo'qlama Tab (faqat pedagog uchun) */}
        {staff.staff_type === "pedagogue" && (
          <TabsContent value="yoklama" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  O'quvchilar yo'qlama
                </CardTitle>
                <CardDescription>
                  Sinf tanlang va o'quvchilar davomatini belgilang
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-2 block">Sinf</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sinf tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-2 block">Sana</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: uz }) : "Sana tanlang"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {teacherClasses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sizga biriktirilgan sinflar topilmadi</p>
                    <p className="text-sm">Dars jadvalida sinflar biriktirilishi kerak</p>
                  </div>
                )}

                {/* Students Table */}
                {selectedClass && (
                  <>
                    {isLoadingStudents ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : students.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Bu sinfda o'quvchilar topilmadi</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Jami: {students.length} o'quvchi</span>
                            {existingAttendance.length > 0 && (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                <Check className="h-3 w-3 mr-1" />
                                Saqlangan
                              </Badge>
                            )}
                          </div>
                          <Button onClick={saveStudentAttendance} disabled={isSaving}>
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saqlanmoqda...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Saqlash
                              </>
                            )}
                          </Button>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>O'quvchi ismi</TableHead>
                              <TableHead className="text-center">Keldi</TableHead>
                              <TableHead className="text-center">Kelmadi</TableHead>
                              <TableHead className="text-center">Kechikdi</TableHead>
                              <TableHead className="text-center">Sababli</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student, index) => (
                              <TableRow key={student.id}>
                                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                <TableCell className="font-medium">{student.full_name}</TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant={studentAttendance[student.id] === "present" ? "default" : "outline"}
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      studentAttendance[student.id] === "present" && "bg-green-600 hover:bg-green-700"
                                    )}
                                    onClick={() => setStudentAttendance(prev => ({ ...prev, [student.id]: "present" }))}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant={studentAttendance[student.id] === "absent" ? "default" : "outline"}
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      studentAttendance[student.id] === "absent" && "bg-red-600 hover:bg-red-700"
                                    )}
                                    onClick={() => setStudentAttendance(prev => ({ ...prev, [student.id]: "absent" }))}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant={studentAttendance[student.id] === "late" ? "default" : "outline"}
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      studentAttendance[student.id] === "late" && "bg-yellow-600 hover:bg-yellow-700"
                                    )}
                                    onClick={() => setStudentAttendance(prev => ({ ...prev, [student.id]: "late" }))}
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant={studentAttendance[student.id] === "excused" ? "default" : "outline"}
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      studentAttendance[student.id] === "excused" && "bg-blue-600 hover:bg-blue-700"
                                    )}
                                    onClick={() => setStudentAttendance(prev => ({ ...prev, [student.id]: "excused" }))}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 pt-4 border-t text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-600"></div>
                            <span className="text-muted-foreground">Keldi</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-600"></div>
                            <span className="text-muted-foreground">Kelmadi</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-yellow-600"></div>
                            <span className="text-muted-foreground">Kechikdi</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                            <span className="text-muted-foreground">Sababli</span>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Summativ baholash Tab (faqat pedagog uchun) */}
        {staff.staff_type === "pedagogue" && (
          <TabsContent value="summativ" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Summativ baholash - {staff.subjects?.name || "Fan"}
                </CardTitle>
                <CardDescription>
                  BSB (Bosqichli Summativ Baholash) va CHSB (Chorak Summativ Baholash) ishlarini baholash
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Baholash turi</label>
                    <Select value={assessmentType} onValueChange={(v: "bsb" | "chsb") => setAssessmentType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bsb">BSB (Bosqichli)</SelectItem>
                        <SelectItem value="chsb">CHSB (Chorak)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Chorak</label>
                    <Select value={assessmentQuarter} onValueChange={setAssessmentQuarter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">I chorak</SelectItem>
                        <SelectItem value="2">II chorak</SelectItem>
                        <SelectItem value="3">III chorak</SelectItem>
                        <SelectItem value="4">IV chorak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Sinf</label>
                    <Select value={assessmentClass} onValueChange={setAssessmentClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sinf tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={saveAssessment} 
                      disabled={isSavingAssessment || !assessmentClass || assessmentStudents.length === 0}
                      className="w-full"
                    >
                      {isSavingAssessment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saqlanmoqda...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Saqlash
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {teacherClasses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sizga biriktirilgan sinflar topilmadi</p>
                    <p className="text-sm">Dars jadvalida sinflar biriktirilishi kerak</p>
                  </div>
                )}

                {/* Tasks Setup */}
                {assessmentClass && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Topshiriqlar ({assessmentTasks.length} ta)
                      </h3>
                      <Button variant="outline" size="sm" onClick={addTask}>
                        <Plus className="h-4 w-4 mr-2" />
                        Topshiriq qo'shish
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assessmentTasks.map((task, index) => (
                        <div key={task.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                          <Input
                            value={task.name}
                            onChange={(e) => updateTask(task.id, "name", e.target.value)}
                            className="flex-1"
                            placeholder="Topshiriq nomi"
                          />
                          <Input
                            type="number"
                            value={task.maxScore}
                            onChange={(e) => updateTask(task.id, "maxScore", parseInt(e.target.value) || 0)}
                            className="w-20"
                            min={1}
                            max={100}
                          />
                          <span className="text-sm text-muted-foreground">ball</span>
                          {assessmentTasks.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTask(task.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Maksimal ball: <span className="font-medium text-foreground">{calculateMaxScore()}</span>
                    </div>
                  </div>
                )}

                {/* Students Grading Table */}
                {assessmentClass && (
                  <>
                    {isLoadingAssessment ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : assessmentStudents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Bu sinfda o'quvchilar topilmadi</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead className="min-w-[200px]">O'quvchi FISH</TableHead>
                              {assessmentTasks.map((task) => (
                                <TableHead key={task.id} className="text-center min-w-[100px]">
                                  {task.name}
                                  <div className="text-xs text-muted-foreground font-normal">
                                    (max: {task.maxScore})
                                  </div>
                                </TableHead>
                              ))}
                              <TableHead className="text-center">Jami</TableHead>
                              <TableHead className="text-center">%</TableHead>
                              <TableHead className="text-center">Baho</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assessmentStudents.map((student, index) => {
                              const percentage = calculatePercentage(student.id)
                              const gradeInfo = getGradeFromPercentage(percentage)
                              return (
                                <TableRow key={student.id}>
                                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                  <TableCell className="font-medium">{student.full_name}</TableCell>
                                  {assessmentTasks.map((task) => (
                                    <TableCell key={task.id} className="text-center">
                                      <Input
                                        type="number"
                                        value={studentScores[student.id]?.[task.id] || 0}
                                        onChange={(e) => updateStudentScore(student.id, task.id, parseInt(e.target.value) || 0)}
                                        className="w-16 mx-auto text-center"
                                        min={0}
                                        max={task.maxScore}
                                      />
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-center font-medium">
                                    {calculateTotalScore(student.id)} / {calculateMaxScore()}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={cn(
                                      percentage >= 86 ? "bg-green-500/20 text-green-400" :
                                      percentage >= 71 ? "bg-blue-500/20 text-blue-400" :
                                      percentage >= 56 ? "bg-yellow-500/20 text-yellow-400" :
                                      "bg-red-500/20 text-red-400"
                                    )}>
                                      {percentage}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={cn(
                                      gradeInfo.grade === 5 ? "bg-green-500/20 text-green-400" :
                                      gradeInfo.grade === 4 ? "bg-blue-500/20 text-blue-400" :
                                      gradeInfo.grade === 3 ? "bg-yellow-500/20 text-yellow-400" :
                                      "bg-red-500/20 text-red-400"
                                    )}>
                                      {gradeInfo.grade} ({gradeInfo.label})
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                        
                        {/* Summary */}
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-medium mb-3">Umumiy natijalar</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Jami o'quvchilar:</span>
                              <span className="ml-2 font-medium">{assessmentStudents.length}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">A'lo (86-100%):</span>
                              <span className="ml-2 font-medium text-green-500">
                                {assessmentStudents.filter(s => calculatePercentage(s.id) >= 86).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Yaxshi (71-85%):</span>
                              <span className="ml-2 font-medium text-blue-500">
                                {assessmentStudents.filter(s => {
                                  const p = calculatePercentage(s.id)
                                  return p >= 71 && p < 86
                                }).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Qoniqarli (56-70%):</span>
                              <span className="ml-2 font-medium text-yellow-500">
                                {assessmentStudents.filter(s => {
                                  const p = calculatePercentage(s.id)
                                  return p >= 56 && p < 71
                                }).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Qoniqarsiz (0-55%):</span>
                              <span className="ml-2 font-medium text-red-500">
                                {assessmentStudents.filter(s => calculatePercentage(s.id) < 56).length}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">O'rtacha ball:</span>
                              <span className="ml-2 font-medium">
                                {assessmentStudents.length > 0 
                                  ? Math.round(assessmentStudents.reduce((sum, s) => sum + calculatePercentage(s.id), 0) / assessmentStudents.length)
                                  : 0}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">O'zlashtirish:</span>
                              <span className="ml-2 font-medium">
                                {assessmentStudents.length > 0 
                                  ? Math.round((assessmentStudents.filter(s => calculatePercentage(s.id) >= 56).length / assessmentStudents.length) * 100)
                                  : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
