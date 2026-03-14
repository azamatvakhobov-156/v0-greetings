"use client"

import { useState } from "react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { CalendarIcon, Check, X, Clock, FileText, Users, Briefcase } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { classes, students, staff } from "@/lib/mock-data"

type AttendanceStatus = "present" | "absent" | "excused" | "late"

interface AttendanceRecord {
  id: string
  name: string
  status: AttendanceStatus
  position?: string
  department?: string
}

const statusConfig: Record<
  AttendanceStatus,
  { label: string; icon: typeof Check; className: string }
> = {
  present: {
    label: "Keldi",
    icon: Check,
    className: "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20",
  },
  absent: {
    label: "Kelmadi",
    icon: X,
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  excused: {
    label: "Sababli",
    icon: FileText,
    className: "bg-chart-3/10 text-chart-3 hover:bg-chart-3/20",
  },
  late: {
    label: "Kechikdi",
    icon: Clock,
    className: "bg-primary/10 text-primary hover:bg-primary/20",
  },
}

const departments = [
  { id: "all", name: "Barcha bo'limlar" },
  { id: "O'quv", name: "O'quv bo'limi" },
  { id: "Rahbariyat", name: "Rahbariyat" },
  { id: "Ma'naviyat", name: "Ma'naviyat bo'limi" },
  { id: "Kadrlar", name: "Kadrlar bo'limi" },
  { id: "Xo'jalik", name: "Xo'jalik bo'limi" },
]

export default function DavomatPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<"students" | "staff">("students")
  
  // O'quvchilar davomati
  const [selectedClass, setSelectedClass] = useState<string>("1")
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>(() => {
    const classStudents = students.filter((s) => s.classId === "1")
    return classStudents.map((s) => ({
      id: s.id,
      name: s.fullName,
      status: "present" as AttendanceStatus,
    }))
  })

  // Xodimlar davomati
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [staffAttendance, setStaffAttendance] = useState<AttendanceRecord[]>(() => {
    return staff.map((s) => ({
      id: s.id,
      name: s.fullName,
      status: "present" as AttendanceStatus,
      position: s.position,
      department: s.department,
    }))
  })

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    const classStudents = students.filter((s) => s.classId === classId)
    setStudentAttendance(
      classStudents.map((s) => ({
        id: s.id,
        name: s.fullName,
        status: "present" as AttendanceStatus,
      }))
    )
  }

  const handleDepartmentChange = (departmentId: string) => {
    setSelectedDepartment(departmentId)
  }

  const handleStudentStatusChange = (id: string, status: AttendanceStatus) => {
    setStudentAttendance((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
  }

  const handleStaffStatusChange = (id: string, status: AttendanceStatus) => {
    setStaffAttendance((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
  }

  const selectedClassName = classes.find((c) => c.id === selectedClass)?.name || ""

  // Filtered staff by department
  const filteredStaff = selectedDepartment === "all" 
    ? staffAttendance 
    : staffAttendance.filter(s => s.department === selectedDepartment)

  // Stats calculation
  const studentStats = {
    present: studentAttendance.filter((a) => a.status === "present").length,
    absent: studentAttendance.filter((a) => a.status === "absent").length,
    excused: studentAttendance.filter((a) => a.status === "excused").length,
    late: studentAttendance.filter((a) => a.status === "late").length,
  }

  const staffStats = {
    present: filteredStaff.filter((a) => a.status === "present").length,
    absent: filteredStaff.filter((a) => a.status === "absent").length,
    excused: filteredStaff.filter((a) => a.status === "excused").length,
    late: filteredStaff.filter((a) => a.status === "late").length,
  }

  const currentStats = activeTab === "students" ? studentStats : staffStats

  return (
    <>
      <Header
        title="Davomat"
        description="O'quvchilar va xodimlar davomatini kuzatish va qayd etish"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "students" | "staff")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="students" className="gap-2">
                <Users className="h-4 w-4" />
                O'quvchilar
              </TabsTrigger>
              <TabsTrigger value="staff" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Xodimlar
              </TabsTrigger>
            </TabsList>

            {/* Sana tanlash */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "d MMMM yyyy", { locale: uz })
                  ) : (
                    <span>Sana tanlang</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* O'quvchilar davomati */}
          <TabsContent value="students" className="space-y-6 mt-6">
            {/* Filtrlar */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sinf tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} sinf
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button>Saqlash</Button>
            </div>

            {/* Statistika */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Keldi</p>
                      <p className="text-2xl font-bold text-chart-2">{studentStats.present}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-chart-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kelmadi</p>
                      <p className="text-2xl font-bold text-destructive">{studentStats.absent}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sababli</p>
                      <p className="text-2xl font-bold text-chart-3">{studentStats.excused}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-chart-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kechikdi</p>
                      <p className="text-2xl font-bold text-primary">{studentStats.late}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* O'quvchilar jadvali */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedClassName} sinfi - {format(date, "d MMMM yyyy", { locale: uz })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>O&apos;quvchi</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentAttendance.map((student, index) => {
                      const config = statusConfig[student.status]
                      const StatusIcon = config.icon
                      return (
                        <TableRow key={student.id} className="border-border">
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={config.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                                const btnConfig = statusConfig[status]
                                const BtnIcon = btnConfig.icon
                                return (
                                  <Button
                                    key={status}
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      student.status === status && btnConfig.className
                                    )}
                                    onClick={() => handleStudentStatusChange(student.id, status)}
                                  >
                                    <BtnIcon className="h-4 w-4" />
                                  </Button>
                                )
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Xodimlar davomati */}
          <TabsContent value="staff" className="space-y-6 mt-6">
            {/* Filtrlar */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Bo'lim tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button>Saqlash</Button>
            </div>

            {/* Statistika */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Keldi</p>
                      <p className="text-2xl font-bold text-chart-2">{staffStats.present}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-chart-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kelmadi</p>
                      <p className="text-2xl font-bold text-destructive">{staffStats.absent}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sababli</p>
                      <p className="text-2xl font-bold text-chart-3">{staffStats.excused}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-chart-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kechikdi</p>
                      <p className="text-2xl font-bold text-primary">{staffStats.late}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Xodimlar jadvali */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedDepartment === "all" ? "Barcha xodimlar" : departments.find(d => d.id === selectedDepartment)?.name} - {format(date, "d MMMM yyyy", { locale: uz })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Lavozim</TableHead>
                      <TableHead>Bo&apos;lim</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staffMember, index) => {
                      const config = statusConfig[staffMember.status]
                      const StatusIcon = config.icon
                      return (
                        <TableRow key={staffMember.id} className="border-border">
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {staffMember.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {staffMember.position}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {staffMember.department}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={config.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                                const btnConfig = statusConfig[status]
                                const BtnIcon = btnConfig.icon
                                return (
                                  <Button
                                    key={status}
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      staffMember.status === status && btnConfig.className
                                    )}
                                    onClick={() => handleStaffStatusChange(staffMember.id, status)}
                                  >
                                    <BtnIcon className="h-4 w-4" />
                                  </Button>
                                )
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
