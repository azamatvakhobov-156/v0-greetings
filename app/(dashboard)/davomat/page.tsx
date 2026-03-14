"use client"

import { useState } from "react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { CalendarIcon, Check, X, Clock, FileText } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { classes, students } from "@/lib/mock-data"

type AttendanceStatus = "present" | "absent" | "excused" | "late"

interface StudentAttendance {
  studentId: string
  studentName: string
  status: AttendanceStatus
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

export default function DavomatPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedClass, setSelectedClass] = useState<string>("1")
  const [attendance, setAttendance] = useState<StudentAttendance[]>(() => {
    const classStudents = students.filter((s) => s.classId === "1")
    return classStudents.map((s) => ({
      studentId: s.id,
      studentName: s.fullName,
      status: "present" as AttendanceStatus,
    }))
  })

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId)
    const classStudents = students.filter((s) => s.classId === classId)
    setAttendance(
      classStudents.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        status: "present" as AttendanceStatus,
      }))
    )
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) =>
      prev.map((a) => (a.studentId === studentId ? { ...a, status } : a))
    )
  }

  const selectedClassName =
    classes.find((c) => c.id === selectedClass)?.name || ""

  const stats = {
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    excused: attendance.filter((a) => a.status === "excused").length,
    late: attendance.filter((a) => a.status === "late").length,
  }

  return (
    <>
      <Header
        title="Davomat"
        description="O'quvchilar davomatini kuzatish va qayd etish"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Filtrlar */}
        <div className="flex flex-wrap gap-4">
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
                  <p className="text-2xl font-bold text-chart-2">{stats.present}</p>
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
                  <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
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
                  <p className="text-2xl font-bold text-chart-3">{stats.excused}</p>
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
                  <p className="text-2xl font-bold text-primary">{stats.late}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Davomat jadvali */}
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
                {attendance.map((student, index) => {
                  const config = statusConfig[student.status]
                  const StatusIcon = config.icon
                  return (
                    <TableRow key={student.studentId} className="border-border">
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.studentName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={config.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(
                            Object.keys(statusConfig) as AttendanceStatus[]
                          ).map((status) => {
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
                                onClick={() =>
                                  handleStatusChange(student.studentId, status)
                                }
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
      </main>
    </>
  )
}
