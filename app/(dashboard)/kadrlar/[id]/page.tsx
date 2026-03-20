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

export default function StaffProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [attendance, setAttendance] = useState<StaffAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("malumotlar")

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
    }
    
    setIsLoading(false)
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
      </Tabs>
    </div>
  )
}
