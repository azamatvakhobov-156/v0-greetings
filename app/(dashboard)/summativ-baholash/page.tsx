"use client"

import { useState, useEffect } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  FileText,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  AlertTriangle,
  Plus,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { createClient } from "@/lib/supabase/client"

const quarters = [
  { value: "1", label: "I chorak" },
  { value: "2", label: "II chorak" },
  { value: "3", label: "III chorak" },
  { value: "4", label: "IV chorak" },
]

const chartConfig = {
  score: {
    label: "Ball",
    color: "var(--chart-1)",
  },
}

interface ClassOption {
  id: string
  name: string
}

interface SubjectOption {
  id: string
  name: string
}

interface StudentWithStats {
  id: string
  fullName: string
  averageGrade: number
  attendance: number
  riskLevel: "low" | "medium" | "high"
}

interface SubjectScorePoint {
  subject: string
  score: number
}

export default function SummativBaholashPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedQuarter, setSelectedQuarter] = useState("1")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [classStudents, setClassStudents] = useState<StudentWithStats[]>([])
  const [subjectPerformanceData, setSubjectPerformanceData] = useState<SubjectScorePoint[]>([])

  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false)
  const [gradeForm, setGradeForm] = useState({
    student_id: "",
    subject_id: "",
    score: "",
  })

  const supabase = createClient()

  const fetchClassesAndSubjects = async () => {
    const [classesRes, subjectsRes] = await Promise.all([
      supabase.from("classes").select("id, name").order("grade").order("section"),
      supabase.from("subjects").select("id, name").order("name"),
    ])
    setClasses(classesRes.data || [])
    setSubjects(subjectsRes.data || [])
    if (classesRes.data && classesRes.data.length > 0 && !selectedClass) {
      setSelectedClass(classesRes.data[0].id)
    }
  }

  const fetchClassData = async (classId: string, quarter: string) => {
    if (!classId) return
    setIsLoading(true)
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, full_name")
      .eq("class_id", classId)
      .order("full_name")

    const studentsList = studentsData || []
    const studentIds = studentsList.map((s) => s.id)

    const [gradesRes, attendanceRes] = await Promise.all([
      studentIds.length > 0
        ? supabase
            .from("grades")
            .select("student_id, score")
            .in("student_id", studentIds)
            .eq("quarter", Number(quarter))
        : Promise.resolve({ data: [] }),
      studentIds.length > 0
        ? supabase.from("student_attendance").select("student_id, status").in("student_id", studentIds)
        : Promise.resolve({ data: [] }),
    ])

    const grades = gradesRes.data || []
    const attendance = attendanceRes.data || []

    const withStats: StudentWithStats[] = studentsList.map((s) => {
      const studentGrades = grades.filter((g) => g.student_id === s.id)
      const avg5 =
        studentGrades.length > 0
          ? studentGrades.reduce((acc, g) => acc + Number(g.score), 0) / studentGrades.length / 20
          : 0
      const studentAttendance = attendance.filter((a) => a.student_id === s.id)
      const presentCount = studentAttendance.filter((a) => a.status === "present").length
      const attendancePct =
        studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 100

      let riskLevel: "low" | "medium" | "high" = "low"
      if (avg5 < 3 || attendancePct < 80) riskLevel = "high"
      else if (avg5 < 4 || attendancePct < 90) riskLevel = "medium"

      return {
        id: s.id,
        fullName: s.full_name,
        averageGrade: avg5,
        attendance: attendancePct,
        riskLevel,
      }
    })

    setClassStudents(withStats)
    setIsLoading(false)
  }

  const fetchSubjectPerformance = async () => {
    const { data: gradesRes } = await supabase.from("grades").select("subject_id, score")
    const grades = gradesRes || []
    const bySubject = new Map<string, number[]>()
    grades.forEach((g) => {
      const arr = bySubject.get(g.subject_id) || []
      arr.push(Number(g.score))
      bySubject.set(g.subject_id, arr)
    })
    const { data: subjectsData } = await supabase.from("subjects").select("id, name")
    const chartData = (subjectsData || [])
      .map((subj) => {
        const scores = bySubject.get(subj.id) || []
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        return { subject: subj.name, score: Math.round(avg) }
      })
      .filter((d) => d.score > 0)
    setSubjectPerformanceData(chartData)
  }

  useEffect(() => {
    fetchClassesAndSubjects()
    fetchSubjectPerformance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedClass) fetchClassData(selectedClass, selectedQuarter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedQuarter])

  const handleSaveGrade = async () => {
    if (!gradeForm.student_id || !gradeForm.subject_id || !gradeForm.score) return
    setIsSaving(true)
    setSaveMessage("")
    const { error } = await supabase.from("grades").insert({
      student_id: gradeForm.student_id,
      subject_id: gradeForm.subject_id,
      grade_type: `summative_${selectedQuarter}`,
      score: Number(gradeForm.score),
      quarter: Number(selectedQuarter),
    })
    setIsSaving(false)
    if (error) {
      console.error("[Summativ baholash] Saqlashda xatolik:", error)
      setSaveMessage("Xatolik: saqlanmadi - " + error.message)
      return
    }
    setIsGradeModalOpen(false)
    setGradeForm({ student_id: "", subject_id: "", score: "" })
    fetchClassData(selectedClass, selectedQuarter)
    fetchSubjectPerformance()
  }

  const filteredStudents = classStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedClassName =
    classes.find((c) => c.id === selectedClass)?.name || ""

  // Calculate statistics
  const avgGrade =
    classStudents.reduce((acc, s) => acc + s.averageGrade, 0) /
    (classStudents.length || 1)
  const excellentCount = classStudents.filter((s) => s.averageGrade >= 4.5).length
  const goodCount = classStudents.filter(
    (s) => s.averageGrade >= 3.5 && s.averageGrade < 4.5
  ).length
  const riskCount = classStudents.filter((s) => s.riskLevel === "high").length

  if (isLoading && classStudents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Header
        title="Summativ baholash"
        description="Choraklik baholar va o'zlashtirish tahlili"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Filtrlar */}
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
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

            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Chorak" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="O'quvchi qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setIsGradeModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Baho qo&apos;yish
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Eksport
            </Button>
          </div>
        </div>

        {/* Statistika */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">O&apos;rtacha ball</p>
                  <p className="text-2xl font-bold text-foreground">
                    {avgGrade.toFixed(1)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A&apos;lochilar</p>
                  <p className="text-2xl font-bold text-chart-2">
                    {excellentCount}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Yaxshi o&apos;quvchilar</p>
                  <p className="text-2xl font-bold text-chart-3">
                    {goodCount}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Xavf guruhida</p>
                  <p className="text-2xl font-bold text-destructive">
                    {riskCount}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tablar */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">O&apos;quvchilar</TabsTrigger>
            <TabsTrigger value="subjects">Fanlar bo&apos;yicha</TabsTrigger>
            <TabsTrigger value="analytics">Tahlil</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedClassName} sinfi - {quarters.find((q) => q.value === selectedQuarter)?.label} natijalari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>O&apos;quvchi</TableHead>
                      <TableHead className="text-center">O&apos;rtacha ball</TableHead>
                      <TableHead className="text-center">Davomat</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student.id} className="border-border">
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.fullName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              student.averageGrade >= 4.5
                                ? "bg-chart-2/10 text-chart-2"
                                : student.averageGrade >= 3.5
                                ? "bg-chart-3/10 text-chart-3"
                                : student.averageGrade >= 2.5
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                            }
                          >
                            {student.averageGrade.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              student.attendance >= 90
                                ? "border-chart-2 text-chart-2"
                                : student.attendance < 80
                                ? "border-destructive text-destructive"
                                : ""
                            }
                          >
                            {student.attendance}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              student.riskLevel === "low"
                                ? "bg-chart-2/10 text-chart-2"
                                : student.riskLevel === "medium"
                                ? "bg-chart-3/10 text-chart-3"
                                : "bg-destructive/10 text-destructive"
                            }
                          >
                            {student.riskLevel === "low"
                              ? "Yaxshi"
                              : student.riskLevel === "medium"
                              ? "O'rta"
                              : "Xavfli"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {student.averageGrade >= 4.0 ? (
                            <TrendingUp className="h-4 w-4 text-chart-2 mx-auto" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Batafsil</DropdownMenuItem>
                              <DropdownMenuItem>Baholar tarixi</DropdownMenuItem>
                              <DropdownMenuItem>Hisobot</DropdownMenuItem>
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
                <CardTitle className="text-base">
                  Fanlar bo&apos;yicha o&apos;zlashtirish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectPerformanceData} layout="vertical">
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis
                        type="number"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <YAxis
                        type="category"
                        dataKey="subject"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="score"
                        fill="var(--chart-1)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Choraklar bo&apos;yicha dinamika</CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Choraklar bo&apos;yicha taqqoslash grafigi
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Sinflar taqqoslash</CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Sinflar o&apos;rtasidagi taqqoslash
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Baho qo&apos;yish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>O&apos;quvchi</Label>
                <Select
                  value={gradeForm.student_id}
                  onValueChange={(v) => setGradeForm((p) => ({ ...p, student_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="O'quvchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {classStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fan</Label>
                <Select
                  value={gradeForm.subject_id}
                  onValueChange={(v) => setGradeForm((p) => ({ ...p, subject_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fanni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ball (0-100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                />
              </div>
            </div>
            {saveMessage && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                {saveMessage}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGradeModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={() => handleSaveGrade()} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Saqlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
