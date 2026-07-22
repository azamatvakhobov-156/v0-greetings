"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
  Loader2,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

interface ClassRow {
  id: string
  name: string
  grade: number
  section: string
  student_count: number
  studentsCount: number
  averageGrade: number
  attendanceRate: number
}

interface SubjectRow {
  id: string
  name: string
  description: string | null
  lessonsCount: number
}

export default function OquvBolimiPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [classForm, setClassForm] = useState({ name: "", grade: "1", section: "A" })
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const fetchData = async () => {
    setIsLoading(true)
    const [classesRes, subjectsRes, studentsRes, gradesRes, attendanceRes, scheduleRes] =
      await Promise.all([
        supabase.from("classes").select("id, name, grade, section, student_count").order("grade").order("section"),
        supabase.from("subjects").select("id, name, description").order("name"),
        supabase.from("students").select("id, class_id"),
        supabase.from("grades").select("student_id, score"),
        supabase.from("student_attendance").select("student_id, status"),
        supabase.from("schedule").select("id, subject_id"),
      ])

    const studentsList = studentsRes.data || []
    const grades = gradesRes.data || []
    const attendance = attendanceRes.data || []
    const schedule = scheduleRes.data || []

    const classesWithStats: ClassRow[] = (classesRes.data || []).map((cls) => {
      const classStudentIds = studentsList
        .filter((s) => s.class_id === cls.id)
        .map((s) => s.id)
      const classGrades = grades.filter((g) => classStudentIds.includes(g.student_id))
      const avgGrade =
        classGrades.length > 0
          ? classGrades.reduce((acc, g) => acc + Number(g.score), 0) / classGrades.length / 20
          : 0
      const classAttendance = attendance.filter((a) => classStudentIds.includes(a.student_id))
      const presentCount = classAttendance.filter((a) => a.status === "present").length
      const attendanceRate =
        classAttendance.length > 0 ? Math.round((presentCount / classAttendance.length) * 100) : 0

      return {
        ...cls,
       studentsCount: classStudentIds.length,
        averageGrade: avgGrade,
        attendanceRate,
      }
    })

    const subjectsWithStats: SubjectRow[] = (subjectsRes.data || []).map((subj) => ({
      ...subj,
      lessonsCount: schedule.filter((s) => s.subject_id === subj.id).length,
    }))

    setClasses(classesWithStats)
    setSubjects(subjectsWithStats)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveClass = async () => {
    if (!classForm.name) return
    setIsSaving(true)
    await supabase.from("classes").insert({
      name: classForm.name,
      grade: Number(classForm.grade),
      section: classForm.section,
    })
    setIsSaving(false)
    setIsClassModalOpen(false)
    setClassForm({ name: "", grade: "1", section: "A" })
    fetchData()
  }

  const handleDeleteClass = async (id: string) => {
    await supabase.from("classes").delete().eq("id", id)
    fetchData()
  }

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSubjects = subjects.filter((subj) =>
    subj.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalStudents = classes.reduce((acc, cls) => acc + cls.studentsCount, 0)
  const averageGrade =
    classes.length > 0
      ? classes.reduce((acc, cls) => acc + cls.averageGrade, 0) / classes.length
      : 0

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Header
        title="O'quv bo'limi"
        description="Sinflar, fanlar va o'quv jarayonini boshqarish"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Statistika */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jami sinflar</p>
                  <p className="text-2xl font-bold text-foreground">
                    {classes.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jami o&apos;quvchilar</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalStudents}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">O&apos;rtacha ball</p>
                  <p className="text-2xl font-bold text-foreground">
                    {averageGrade.toFixed(1)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Qidirish va qo'shish */}
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setIsClassModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi sinf qo&apos;shish
          </Button>
        </div>

        <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi sinf qo&apos;shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sinf nomi</Label>
                <Input
                  placeholder="Masalan: 5-A"
                  value={classForm.name}
                  onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sinf raqami</Label>
                  <Input
                    type="number"
                    min={1}
                    max={11}
                    value={classForm.grade}
                    onChange={(e) => setClassForm((p) => ({ ...p, grade: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bo&apos;lim (A, B...)</Label>
                  <Input
                    value={classForm.section}
                    onChange={(e) => setClassForm((p) => ({ ...p, section: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsClassModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleSaveClass} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Saqlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tablar */}
        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="classes">Sinflar</TabsTrigger>
            <TabsTrigger value="subjects">Fanlar</TabsTrigger>
            <TabsTrigger value="plans">O&apos;quv rejalari</TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Sinflar ro&apos;yxati</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Sinf</TableHead>
                      <TableHead className="text-center">O&apos;quvchilar</TableHead>
                      <TableHead className="text-center">O&apos;rtacha ball</TableHead>
                      <TableHead className="text-center">Davomat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((cls) => (
                      <TableRow key={cls.id} className="border-border">
                        <TableCell className="font-medium">
                          {cls.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {cls.studentsCount}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              cls.averageGrade >= 4.0 ? "default" : "secondary"
                            }
                            className={
                              cls.averageGrade >= 4.0
                                ? "bg-chart-2/10 text-chart-2"
                                : ""
                            }
                          >
                            {cls.averageGrade.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              cls.attendanceRate >= 90 ? "default" : "secondary"
                            }
                            className={
                              cls.attendanceRate >= 90
                                ? "bg-primary/10 text-primary"
                                : cls.attendanceRate < 85
                                ? "bg-destructive/10 text-destructive"
                                : ""
                            }
                          >
                            {cls.attendanceRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClass(cls.id)}
                              >
                                O&apos;chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Fanlar ro&apos;yxati</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Fan nomi</TableHead>
                      <TableHead>Tavsif</TableHead>
                      <TableHead className="text-center">Haftalik darslar</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map((subj) => (
                      <TableRow key={subj.id} className="border-border">
                        <TableCell className="font-medium">
                          {subj.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{subj.description}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {subj.lessonsCount} dars
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ko&apos;rish</DropdownMenuItem>
                              <DropdownMenuItem>Tahrirlash</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                O&apos;chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  O&apos;quv rejalari
                </h3>
                <p className="text-muted-foreground mb-4">
                  Bu bo&apos;limda o&apos;quv rejalari va dasturlarni boshqarish mumkin
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi reja qo&apos;shish
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
