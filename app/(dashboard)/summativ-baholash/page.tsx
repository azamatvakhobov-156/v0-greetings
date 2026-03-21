"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
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
  Save,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { createClient } from "@/lib/supabase/client"

interface ClassData {
  id: string
  name: string
  grade: number
  section: string
}

interface Subject {
  id: string
  name: string
}

interface Student {
  id: string
  full_name: string
  class_id: string
}

interface Grade {
  id: string
  student_id: string
  subject_id: string
  grade_type: string
  score: number
  max_score: number
  quarter: number
  academic_year: string
  student?: {
    full_name: string
  }
  subject?: {
    name: string
  }
}

const quarters = [
  { value: "1", label: "I chorak" },
  { value: "2", label: "II chorak" },
  { value: "3", label: "III chorak" },
  { value: "4", label: "IV chorak" },
]

const gradeTypes = [
  { value: "summative_1", label: "SO 1" },
  { value: "summative_2", label: "SO 2" },
  { value: "summative_3", label: "SO 3" },
  { value: "summative_4", label: "SO 4" },
  { value: "final", label: "Yakuniy" },
]

const chartConfig = {
  score: {
    label: "Ball",
    color: "var(--chart-1)",
  },
}

export default function SummativBaholashPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedQuarter, setSelectedQuarter] = useState("1")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Yangi baho qo'shish
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [editingGrades, setEditingGrades] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  // Huquqlarni tekshirish
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const userData = JSON.parse(userStr)
      setCurrentUserId(userData.id)
      const canEditGrades = [
        "admin",
        "director",
        "deputy_academic",
        "head_academic",
        "teacher",
      ].includes(userData.role)
      setCanEdit(canEditGrades)
    }
  }, [])

  // Sinflarni olish
  const fetchClasses = useCallback(async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("grade", { ascending: true })
      .order("section", { ascending: true })

    if (data && !error) {
      setClasses(data)
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].id)
      }
    }
  }, [supabase, selectedClass])

  // Fanlarni olish
  const fetchSubjects = useCallback(async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name")

    if (data && !error) {
      setSubjects(data)
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].id)
      }
    }
  }, [supabase, selectedSubject])

  // O'quvchilarni olish
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return

    const { data, error } = await supabase
      .from("students")
      .select("id, full_name, class_id")
      .eq("class_id", selectedClass)
      .eq("status", "active")
      .order("full_name")

    if (data && !error) {
      setStudents(data)
    }
  }, [supabase, selectedClass])

  // Baholarni olish
  const fetchGrades = useCallback(async () => {
    if (!selectedClass || !selectedSubject) return

    setIsLoading(true)

    const studentIds = students.map((s) => s.id)
    if (studentIds.length === 0) {
      setGrades([])
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("grades")
      .select(`
        *,
        student:student_id(full_name),
        subject:subject_id(name)
      `)
      .in("student_id", studentIds)
      .eq("subject_id", selectedSubject)
      .eq("quarter", parseInt(selectedQuarter))

    if (data && !error) {
      setGrades(data)
    }

    setIsLoading(false)
  }, [supabase, selectedClass, selectedSubject, selectedQuarter, students])

  // Baho qo'shish/yangilash
  const saveGrade = async (studentId: string, gradeType: string, score: number) => {
    if (!currentUserId || !selectedSubject) return

    const existingGrade = grades.find(
      (g) => g.student_id === studentId && g.grade_type === gradeType
    )

    if (existingGrade) {
      // Yangilash
      const { error } = await supabase
        .from("grades")
        .update({
          score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingGrade.id)

      if (error) {
        console.error("Error updating grade:", error)
      }
    } else {
      // Yangi qo'shish
      const { error } = await supabase.from("grades").insert({
        student_id: studentId,
        subject_id: selectedSubject,
        teacher_id: currentUserId,
        grade_type: gradeType,
        score,
        max_score: 100,
        quarter: parseInt(selectedQuarter),
        academic_year: "2025-2026",
      })

      if (error) {
        console.error("Error inserting grade:", error)
      }
    }
  }

  // Barcha baholarni saqlash
  const saveAllGrades = async () => {
    setIsSaving(true)

    for (const [key, score] of Object.entries(editingGrades)) {
      const [studentId, gradeType] = key.split("_")
      await saveGrade(studentId, gradeType, score)
    }

    setEditingGrades({})
    await fetchGrades()
    setIsSaving(false)
  }

  useEffect(() => {
    fetchClasses()
    fetchSubjects()
  }, [fetchClasses, fetchSubjects])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (students.length > 0) {
      fetchGrades()
    }
  }, [students, fetchGrades])

  // O'quvchilar uchun baholar matritsasini yaratish
  const getStudentGrades = (studentId: string) => {
    const studentGrades: Record<string, number> = {}
    grades
      .filter((g) => g.student_id === studentId)
      .forEach((g) => {
        studentGrades[g.grade_type] = g.score
      })
    return studentGrades
  }

  // O'rtacha ballni hisoblash
  const calculateAverage = (studentId: string) => {
    const studentGrades = grades.filter((g) => g.student_id === studentId)
    if (studentGrades.length === 0) return 0
    const sum = studentGrades.reduce((acc, g) => acc + g.score, 0)
    return sum / studentGrades.length
  }

  // Statistika
  const stats = {
    totalStudents: students.length,
    gradesEntered: new Set(grades.map((g) => g.student_id)).size,
    avgScore:
      grades.length > 0
        ? grades.reduce((acc, g) => acc + g.score, 0) / grades.length
        : 0,
    excellent: students.filter((s) => calculateAverage(s.id) >= 85).length,
  }

  // Fanlar bo'yicha statistika (chart uchun)
  const subjectPerformanceData = subjects.map((subject) => {
    const subjectGrades = grades.filter((g) => g.subject_id === subject.id)
    const avgScore =
      subjectGrades.length > 0
        ? subjectGrades.reduce((acc, g) => acc + g.score, 0) / subjectGrades.length
        : 0
    return {
      subject: subject.name,
      score: Math.round(avgScore),
    }
  })

  const selectedClassName =
    classes.find((c) => c.id === selectedClass)?.name || ""
  const selectedSubjectName =
    subjects.find((s) => s.id === selectedSubject)?.name || ""

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Header
        title="Summativ baholash"
        description="Choraklik baholar va o'zlashtirish tahlili"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Filtrlar */}
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sinf tanlang" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Fan tanlang" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subj) => (
                  <SelectItem key={subj.id} value={subj.id}>
                    {subj.name}
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
            {canEdit && Object.keys(editingGrades).length > 0 && (
              <Button onClick={saveAllGrades} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            )}
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
                  <p className="text-sm text-muted-foreground">Jami o'quvchi</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalStudents}
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
                  <p className="text-sm text-muted-foreground">Baho kiritilgan</p>
                  <p className="text-2xl font-bold text-chart-2">
                    {stats.gradesEntered}
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
                  <p className="text-sm text-muted-foreground">O'rtacha ball</p>
                  <p className="text-2xl font-bold text-chart-3">
                    {stats.avgScore.toFixed(1)}
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
                  <p className="text-sm text-muted-foreground">A'lochilar (85+)</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats.excellent}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tablar */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">O'quvchilar</TabsTrigger>
            <TabsTrigger value="subjects">Fanlar bo'yicha</TabsTrigger>
            <TabsTrigger value="analytics">Tahlil</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedClassName} - {selectedSubjectName} -{" "}
                  {quarters.find((q) => q.value === selectedQuarter)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Yuklanmoqda...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    O'quvchilar topilmadi
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead className="min-w-[200px]">O'quvchi</TableHead>
                          {gradeTypes.map((type) => (
                            <TableHead key={type.value} className="text-center w-20">
                              {type.label}
                            </TableHead>
                          ))}
                          <TableHead className="text-center w-24">O'rtacha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student, index) => {
                          const studentGrades = getStudentGrades(student.id)
                          const average = calculateAverage(student.id)

                          return (
                            <TableRow key={student.id} className="border-border">
                              <TableCell className="text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {student.full_name}
                              </TableCell>
                              {gradeTypes.map((type) => {
                                const key = `${student.id}_${type.value}`
                                const existingScore = studentGrades[type.value]
                                const editingScore = editingGrades[key]
                                const displayScore =
                                  editingScore !== undefined
                                    ? editingScore
                                    : existingScore

                                return (
                                  <TableCell key={type.value} className="text-center">
                                    {canEdit ? (
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={displayScore ?? ""}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          if (value === "") {
                                            const newGrades = { ...editingGrades }
                                            delete newGrades[key]
                                            setEditingGrades(newGrades)
                                          } else {
                                            const numValue = Math.min(
                                              100,
                                              Math.max(0, parseInt(value) || 0)
                                            )
                                            setEditingGrades({
                                              ...editingGrades,
                                              [key]: numValue,
                                            })
                                          }
                                        }}
                                        className="w-16 h-8 text-center mx-auto"
                                      />
                                    ) : displayScore !== undefined ? (
                                      <Badge
                                        className={
                                          displayScore >= 85
                                            ? "bg-chart-2/10 text-chart-2"
                                            : displayScore >= 65
                                            ? "bg-chart-3/10 text-chart-3"
                                            : displayScore >= 40
                                            ? "bg-primary/10 text-primary"
                                            : "bg-destructive/10 text-destructive"
                                        }
                                      >
                                        {displayScore}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                )
                              })}
                              <TableCell className="text-center">
                                {average > 0 ? (
                                  <Badge
                                    className={
                                      average >= 85
                                        ? "bg-chart-2/10 text-chart-2"
                                        : average >= 65
                                        ? "bg-chart-3/10 text-chart-3"
                                        : average >= 40
                                        ? "bg-primary/10 text-primary"
                                        : "bg-destructive/10 text-destructive"
                                    }
                                  >
                                    {average.toFixed(1)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  Fanlar bo'yicha o'zlashtirish - {selectedClassName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjectPerformanceData.length > 0 &&
                subjectPerformanceData.some((d) => d.score > 0) ? (
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
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Hali baholar kiritilmagan
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">
                    Choraklar bo'yicha dinamika
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Choraklar bo'yicha taqqoslash grafigi
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    (Barcha choraklar uchun baholar kiritilgandan so'ng
                    ko'rinadi)
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
                    Sinflar o'rtasidagi taqqoslash
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    (Ko'proq ma'lumot kiritilgandan so'ng ko'rinadi)
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
