"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
    FileQuestion,
    Search,
    Download,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    AlertTriangle,
    Plus,
    X,
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
    const router = useRouter()
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

  const [bsbSubject, setBsbSubject] = useState("")
    const [bsbNumber, setBsbNumber] = useState("1")
    const [bsbAssessment, setBsbAssessment] = useState<{ id: string; title: string | null } | null>(null)
    const [bsbCriteria, setBsbCriteria] = useState<Array<{ id: string; name: string; max_score: number }>>([])
    const [bsbScores, setBsbScores] = useState<Record<string, Record<string, string>>>({})
    const [isBsbLoading, setIsBsbLoading] = useState(false)
    const [isBsbSaving, setIsBsbSaving] = useState(false)
    const [bsbMessage, setBsbMessage] = useState("")
    const [isBsbSetupOpen, setIsBsbSetupOpen] = useState(false)
    const [bsbSetupTitle, setBsbSetupTitle] = useState("")
    const [bsbSetupCriteria, setBsbSetupCriteria] = useState<Array<{ name: string; max_score: string }>>([
      { name: "", max_score: "" },
        ])

  const supabase = createClient()

  const fetchClassesAndSubjects = async () => {
        const [classesRes, subjectsRes] = await Promise.all([
                supabase.from("classes").select("id, name").gte("grade", 5).lte("grade", 11).order("grade").order("section"),
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

  const fetchBsbAssessment = async () => {
        if (!selectedClass || !bsbSubject) {
                setBsbAssessment(null)
                setBsbCriteria([])
                setBsbScores({})
                return
        }
        setIsBsbLoading(true)
        const { data: assessment } = await supabase
          .from("bsb_assessments")
          .select("id, title")
          .eq("subject_id", bsbSubject)
          .eq("class_id", selectedClass)
          .eq("quarter", Number(selectedQuarter))
          .eq("bsb_number", Number(bsbNumber))
          .maybeSingle()

        if (!assessment) {
                setBsbAssessment(null)
                setBsbCriteria([])
                setBsbScores({})
                setIsBsbLoading(false)
                return
        }

        setBsbAssessment(assessment)

        const { data: criteriaData } = await supabase
          .from("bsb_criteria")
          .select("id, name, max_score")
          .eq("bsb_assessment_id", assessment.id)
          .order("order_index")
        setBsbCriteria(criteriaData || [])

        const { data: scoresData } = await supabase
          .from("bsb_scores")
          .select("student_id, criterion_id, score")
          .eq("bsb_assessment_id", assessment.id)

        const grid: Record<string, Record<string, string>> = {}
              ;(scoresData || []).forEach((s) => {
                if (!grid[s.student_id]) grid[s.student_id] = {}
                        grid[s.student_id][s.criterion_id] = String(s.score)
        })
        setBsbScores(grid)
        setIsBsbLoading(false)
  }

  useEffect(() => {
        fetchBsbAssessment()
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedQuarter, bsbSubject, bsbNumber])

  const handleAddCriteriaRow = () => {
        setBsbSetupCriteria((prev) => [...prev, { name: "", max_score: "" }])
  }

  const handleRemoveCriteriaRow = (index: number) => {
        setBsbSetupCriteria((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCreateBsb = async () => {
        if (!bsbSubject || !selectedClass) return
        const validCriteria = bsbSetupCriteria.filter((c) => c.name && c.max_score)
        if (validCriteria.length === 0) return
        setIsBsbSaving(true)
        const { data: assessment, error } = await supabase
          .from("bsb_assessments")
          .insert({
                    subject_id: bsbSubject,
                    class_id: selectedClass,
                    quarter: Number(selectedQuarter),
                    bsb_number: Number(bsbNumber),
                    title: bsbSetupTitle || null,
          })
          .select("id, title")
          .single()

        if (error || !assessment) {
                setIsBsbSaving(false)
                setBsbMessage("Xatolik: BSB yaratilmadi - " + (error?.message || ""))
                return
        }

        const criteriaRows = validCriteria.map((c, index) => ({
                bsb_assessment_id: assessment.id,
                name: c.name,
                max_score: Number(c.max_score),
                order_index: index,
        }))
        await supabase.from("bsb_criteria").insert(criteriaRows)

        setIsBsbSaving(false)
        setIsBsbSetupOpen(false)
        setBsbSetupTitle("")
        setBsbSetupCriteria([{ name: "", max_score: "" }])
        fetchBsbAssessment()
  }

  const handleBsbScoreChange = (studentId: string, criterionId: string, value: string) => {
        setBsbScores((prev) => ({
                ...prev,
                [studentId]: { ...prev[studentId], [criterionId]: value },
        }))
  }

  const bsbMaxTotal = bsbCriteria.reduce((acc, c) => acc + c.max_score, 0)

  const getBsbStudentTotal = (studentId: string) => {
        const studentScores = bsbScores[studentId] || {}
              return bsbCriteria.reduce((acc, c) => acc + (Number(studentScores[c.id]) || 0), 0)
  }

  const handleSaveBsbScores = async () => {
        if (!bsbAssessment) return
        setIsBsbSaving(true)
        setBsbMessage("")

        const rows: Array<{ bsb_assessment_id: string; student_id: string; criterion_id: string; score: number }> = []
              classStudents.forEach((s) => {
                      bsbCriteria.forEach((c) => {
                                const value = bsbScores[s.id]?.[c.id]
                                if (value !== undefined && value !== "") {
                                            rows.push({
                                                          bsb_assessment_id: bsbAssessment.id,
                                                          student_id: s.id,
                                                          criterion_id: c.id,
                                                          score: Math.min(Number(value), c.max_score),
                                            })
                                }
                      })
              })

        if (rows.length > 0) {
                const { error } = await supabase
                  .from("bsb_scores")
                  .upsert(rows, { onConflict: "bsb_assessment_id,student_id,criterion_id" })
                if (error) {
                          setIsBsbSaving(false)
                          setBsbMessage("Xatolik: saqlanmadi - " + error.message)
                          return
                }
        }

        const gradeRows = classStudents
          .map((s) => ({
                    student_id: s.id,
                    subject_id: bsbSubject,
                    grade_type: `bsb_${bsbNumber}`,
                    score: (getBsbStudentTotal(s.id) / (bsbMaxTotal || 1)) * 100,
                    quarter: Number(selectedQuarter),
          }))
          .filter((g) => g.score > 0)

        if (gradeRows.length > 0) {
                await supabase.from("grades").upsert(gradeRows, { onConflict: "student_id,subject_id,grade_type,quarter" })
        }

        setIsBsbSaving(false)
        setBsbMessage("BSB natijalari muvaffaqiyatli saqlandi.")
        fetchClassData(selectedClass, selectedQuarter)
        fetchSubjectPerformance()
  }

  const handleSaveGrade = async () => {
        if (!gradeForm.student_id || !gradeForm.subject_id || !gradeForm.score) return
        setIsSaving(true)
        setSaveMessage("")
        const { error } = await supabase.from("grades").upsert({
                student_id: gradeForm.student_id,
                subject_id: gradeForm.subject_id,
                grade_type: `summative_${selectedQuarter}`,
                score: Number(gradeForm.score),
                quarter: Number(selectedQuarter),
        }, { onConflict: "student_id,subject_id,grade_type,quarter" })
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
                </div>div>
              )
  }
  
    return (
          <>
                <Header
                          title="Summativ baholash"
                          description="Choraklik baholar va o'zlashtirish tahlili"
                        />
          
                <main className="flex-1 p-6 space-y-6">
                        <div className="flex flex-wrap gap-4 justify-between">
                                  <div className="flex gap-4">
                                              <Select value={selectedClass} onValueChange={setSelectedClass}>
                                                            <SelectTrigger className="w-[180px]">
                                                                            <SelectValue placeholder="Sinf tanlang" />
                                                            </SelectTrigger>SelectTrigger>
                                                            <SelectContent>
                                                              {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} sinf
                              </SelectItem>SelectItem>
                            ))}
                                                            </SelectContent>SelectContent>
                                              </Select>Select>
                                  
                                              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                                                            <SelectTrigger className="w-[150px]">
                                                                            <SelectValue placeholder="Chorak" />
                                                            </SelectTrigger>SelectTrigger>
                                                            <SelectContent>
                                                              {quarters.map((q) => (
                              <SelectItem key={q.value} value={q.value}>
                                {q.label}
                              </SelectItem>SelectItem>
                            ))}
                                                            </SelectContent>SelectContent>
                                              </Select>Select>
                                  
                                              <div className="relative w-64">
                                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                            <Input
                                                                              placeholder="O'quvchi qidirish..."
                                                                              value={searchQuery}
                                                                              onChange={(e) => setSearchQuery(e.target.value)}
                                                                              className="pl-9"
                                                                            />
                                              </div>div>
                                  </div>div>
                        
                                  <div className="flex gap-2">
                                              <Button variant="outline" onClick={() => router.push("/summativ-baholash/testlar")}>
                                                            <FileQuestion className="mr-2 h-4 w-4" />
                                                            Testlar
                                              </Button>Button>
                                              <Button onClick={() => setIsGradeModalOpen(true)}>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Baho qo&apos;yish
                                              </Button>Button>
                                              <Button variant="outline">
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Eksport
                                              </Button>Button>
                                  </div>div>
                        </div>div>
                
                        <div className="grid gap-4 md:grid-cols-4">
                                  <Card className="bg-card border-border">
                                              <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                            <div>
                                                                                              <p className="text-sm text-muted-foreground">O&apos;rtacha ball</p>p>
                                                                                              <p className="text-2xl font-bold text-foreground">
                                                                                                {avgGrade.toFixed(1)}
                                                                                                </p>p>
                                                                            </div>div>
                                                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                                              <FileText className="h-5 w-5 text-primary" />
                                                                            </div>div>
                                                            </div>div>
                                              </CardContent>CardContent>
                                  </Card>Card>
                                  <Card className="bg-card border-border">
                                              <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                            <div>
                                                                                              <p className="text-sm text-muted-foreground">A&apos;lochilar</p>p>
                                                                                              <p className="text-2xl font-bold text-chart-2">
                                                                                                {excellentCount}
                                                                                                </p>p>
                                                                            </div>div>
                                                                            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                                                                                              <TrendingUp className="h-5 w-5 text-chart-2" />
                                                                            </div>div>
                                                            </div>div>
                                              </CardContent>CardContent>
                                  </Card>Card>
                                  <Card className="bg-card border-border">
                                              <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                            <div>
                                                                                              <p className="text-sm text-muted-foreground">Yaxshi o&apos;quvchilar</p>p>
                                                                                              <p className="text-2xl font-bold text-chart-3">
                                                                                                {goodCount}
                                                                                                </p>p>
                                                                            </div>div>
                                                                            <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                                                                                              <TrendingUp className="h-5 w-5 text-chart-3" />
                                                                            </div>div>
                                                            </div>div>
                                              </CardContent>CardContent>
                                  </Card>Card>
                                  <Card className="bg-card border-border">
                                              <CardContent className="p-4">
                                                            <div className="flex items-center justify-between">
                                                                            <div>
                                                                                              <p className="text-sm text-muted-foreground">Xavf guruhida</p>p>
                                                                                              <p className="text-2xl font-bold text-destructive">
                                                                                                {riskCount}
                                                                                                </p>p>
                                                                            </div>div>
                                                                            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                                                                              <AlertTriangle className="h-5 w-5 text-destructive" />
                                                                            </div>div>
                                                            </div>div>
                                              </CardContent>CardContent>
                                  </Card>Card>
                        </div>div>
                
                        <Tabs defaultValue="students" className="space-y-4">
                                  <TabsList>
                                              <TabsTrigger value="students">O&apos;quvchilar</TabsTrigger>TabsTrigger>
                                              <TabsTrigger value="bsb">BSB nazorati</TabsTrigger>TabsTrigger>
                                              <TabsTrigger value="subjects">Fanlar bo&apos;yicha</TabsTrigger>TabsTrigger>
                                              <TabsTrigger value="analytics">Tahlil</TabsTrigger>TabsTrigger>
                                  </TabsList>TabsList>
                        
                                  <TabsContent value="students">
                                              <Card className="bg-card border-border">
                                                            <CardHeader>
                                                                            <CardTitle className="text-base">
                                                                              {selectedClassName} sinfi - {quarters.find((q) => q.value === selectedQuarter)?.label} natijalari
                                                                            </CardTitle>CardTitle>
                                                            </CardHeader>CardHeader>
                                                            <CardContent>
                                                                            <Table>
                                                                                              <TableHeader>
                                                                                                                  <TableRow className="border-border">
                                                                                                                                        <TableHead className="w-12">#</TableHead>TableHead>
                                                                                                                                        <TableHead>O&apos;quvchi</TableHead>TableHead>
                                                                                                                                        <TableHead className="text-center">O&apos;rtacha ball</TableHead>TableHead>
                                                                                                                                        <TableHead className="text-center">Davomat</TableHead>TableHead>
                                                                                                                                        <TableHead className="text-center">Holat</TableHead>TableHead>
                                                                                                                                        <TableHead className="text-center">Trend</TableHead>TableHead>
                                                                                                                                        <TableHead className="text-right">Amallar</TableHead>TableHead>
                                                                                                                    </TableRow>TableRow>
                                                                                                </TableHeader>TableHeader>
                                                                                              <TableBody>
                                                                                                {filteredStudents.map((student, index) => (
                                  <TableRow key={student.id} className="border-border">
                                                          <TableCell className="text-muted-foreground">
                                                            {index + 1}
                                                          </TableCell>TableCell>
                                                          <TableCell className="font-medium">
                                                            {student.fullName}
                                                          </TableCell>TableCell>
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
                                                                                      </Badge>Badge>
                                                          </TableCell>TableCell>
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
                                                                                      </Badge>Badge>
                                                          </TableCell>TableCell>
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
                                                                                      </Badge>Badge>
                                                          </TableCell>TableCell>
                                                          <TableCell className="text-center">
                                                            {student.averageGrade >= 4.0 ? (
                                                                <TrendingUp className="h-4 w-4 text-chart-2 mx-auto" />
                                                              ) : (
                                                                <TrendingDown className="h-4 w-4 text-destructive mx-auto" />
                                                              )}
                                                          </TableCell>TableCell>
                                                          <TableCell className="text-right">
                                                                                    <DropdownMenu>
                                                                                                                <DropdownMenuTrigger asChild>
                                                                                                                                              <Button variant="ghost" size="icon">
                                                                                                                                                                              <MoreHorizontal className="h-4 w-4" />
                                                                                                                                                </Button>Button>
                                                                                                                  </DropdownMenuTrigger>DropdownMenuTrigger>
                                                                                                                <DropdownMenuContent align="end">
                                                                                                                                              <DropdownMenuItem>Batafsil</DropdownMenuItem>DropdownMenuItem>
                                                                                                                                              <DropdownMenuItem>Baholar tarixi</DropdownMenuItem>DropdownMenuItem>
                                                                                                                                              <DropdownMenuItem>Hisobot</DropdownMenuItem>DropdownMenuItem>
                                                                                                                  </DropdownMenuContent>DropdownMenuContent>
                                                                                      </DropdownMenu>DropdownMenu>
                                                          </TableCell>TableCell>
                                  </TableRow>TableRow>
                                ))}
                                                                                                </TableBody>TableBody>
                                                                            </Table>Table>
                                                            </CardContent>CardContent>
                                              </Card>Card>
                                  </TabsContent>TabsContent>
                        
                                  <TabsContent value="bsb" className="space-y-4">
                                              <div className="flex flex-wrap gap-4 items-end justify-between">
                                                            <div className="flex flex-wrap gap-4">
                                                                            <div className="space-y-1">
                                                                                              <Label className="text-xs text-muted-foreground">Fan</Label>Label>
                                                                                              <Select value={bsbSubject} onValueChange={setBsbSubject}>
                                                                                                                  <SelectTrigger className="w-[180px]">
                                                                                                                                        <SelectValue placeholder="Fanni tanlang" />
                                                                                                                    </SelectTrigger>SelectTrigger>
                                                                                                                  <SelectContent>
                                                                                                                    {subjects.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.name}
                                    </SelectItem>SelectItem>
                                  ))}
                                                                                                                    </SelectContent>SelectContent>
                                                                                                </Select>Select>
                                                                            </div>div>
                                                                            <div className="space-y-1">
                                                                                              <Label className="text-xs text-muted-foreground">BSB raqami</Label>Label>
                                                                                              <Select value={bsbNumber} onValueChange={setBsbNumber}>
                                                                                                                  <SelectTrigger className="w-[140px]">
                                                                                                                                        <SelectValue />
                                                                                                                    </SelectTrigger>SelectTrigger>
                                                                                                                  <SelectContent>
                                                                                                                                        <SelectItem value="1">1-BSB</SelectItem>SelectItem>
                                                                                                                                        <SelectItem value="2">2-BSB</SelectItem>SelectItem>
                                                                                                                                        <SelectItem value="3">3-BSB</SelectItem>SelectItem>
                                                                                                                    </SelectContent>SelectContent>
                                                                                                </Select>Select>
                                                                            </div>div>
                                                            </div>div>
                                                {bsbAssessment && (
                            <Button onClick={() => handleSaveBsbScores()} disabled={isBsbSaving}>
                              {isBsbSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                              Natijalarni saqlash
                            </Button>Button>
                                                            )}
                                              </div>div>
                                  
                                    {bsbMessage && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                            {bsbMessage}
                          </p>p>
                                              )}
                                  
                                    {!bsbSubject ? (
                          <Card className="bg-card border-border">
                                          <CardContent className="p-12 text-center">
                                                            <p className="text-muted-foreground">
                                                                                Avval fanni tanlang
                                                            </p>p>
                                          </CardContent>CardContent>
                          </Card>Card>
                        ) : isBsbLoading ? (
                          <div className="flex justify-center py-12">
                                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>div>
                        ) : !bsbAssessment ? (
                          <Card className="bg-card border-border">
                                          <CardContent className="p-12 text-center space-y-4">
                                                            <p className="text-muted-foreground">
                                                              {selectedClassName} sinfi uchun {bsbNumber}-BSB hali tuzilmagan
                                                            </p>p>
                                                            <Button onClick={() => setIsBsbSetupOpen(true)}>
                                                                                <Plus className="mr-2 h-4 w-4" />
                                                                                Mezonlarni tuzish
                                                            </Button>Button>
                                          </CardContent>CardContent>
                          </Card>Card>
                        ) : (
                          <Card className="bg-card border-border">
                                          <CardHeader>
                                                            <CardTitle className="text-base">
                                                              {bsbAssessment.title || `${bsbNumber}-BSB`} - Maksimal ball: {bsbMaxTotal}
                                                            </CardTitle>CardTitle>
                                          </CardHeader>CardHeader>
                                          <CardContent>
                                                            <Table>
                                                                                <TableHeader>
                                                                                                      <TableRow className="border-border">
                                                                                                                              <TableHead>O&apos;quvchi</TableHead>TableHead>
                                                                                                        {bsbCriteria.map((c) => (
                                                      <TableHead key={c.id} className="text-center">
                                                        {c.name}
                                                                                  <div className="text-xs text-muted-foreground font-normal">
                                                                                                                (max {c.max_score})
                                                                                    </div>div>
                                                      </TableHead>TableHead>
                                                    ))}
                                                                                                                              <TableHead className="text-center">Jami</TableHead>TableHead>
                                                                                                        </TableRow>TableRow>
                                                                                  </TableHeader>TableHeader>
                                                                                <TableBody>
                                                                                  {classStudents.length === 0 && (
                                                    <TableRow>
                                                                              <TableCell colSpan={bsbCriteria.length + 2} className="text-center text-muted-foreground py-8">
                                                                                                          Bu sinfda o&apos;quvchilar topilmadi
                                                                                </TableCell>TableCell>
                                                    </TableRow>TableRow>
                                                                                                      )}
                                                                                  {classStudents.map((student) => (
                                                    <TableRow key={student.id} className="border-border">
                                                                              <TableCell className="font-medium">{student.fullName}</TableCell>TableCell>
                                                      {bsbCriteria.map((c) => (
                                                                                  <TableCell key={c.id} className="text-center">
                                                                                                                <Input
                                                                                                                                                  type="number"
                                                                                                                                                  min={0}
                                                                                                                                                  max={c.max_score}
                                                                                                                                                  className="w-20 mx-auto text-center"
                                                                                                                                                  value={bsbScores[student.id]?.[c.id] ?? ""}
                                                                                                                                                  onChange={(e) => handleBsbScoreChange(student.id, c.id, e.target.value)}
                                                                                                                                                />
                                                                                    </TableCell>TableCell>
                                                                                ))}
                                                                              <TableCell className="text-center font-semibold">
                                                                                {getBsbStudentTotal(student.id)} / {bsbMaxTotal}
                                                                                </TableCell>TableCell>
                                                    </TableRow>TableRow>
                                                  ))}
                                                                                  </TableBody>TableBody>
                                                            </Table>Table>
                                          </CardContent>CardContent>
                          </Card>Card>
                                              )}
                                  </TabsContent>TabsContent>
                        
                                  <TabsContent value="subjects">
                                              <Card className="bg-card border-border">
                                                            <CardHeader>
                                                                            <CardTitle className="text-base">
                                                                                              Fanlar bo&apos;yicha o&apos;zlashtirish
                                                                            </CardTitle>CardTitle>
                                                            </CardHeader>CardHeader>
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
                                                                                                                    </BarChart>BarChart>
                                                                                                </ResponsiveContainer>ResponsiveContainer>
                                                                            </ChartContainer>ChartContainer>
                                                            </CardContent>CardContent>
                                              </Card>Card>
                                  </TabsContent>TabsContent>
                        
                                  <TabsContent value="analytics">
                                              <div className="grid gap-4 md:grid-cols-2">
                                                            <Card className="bg-card border-border">
                                                                            <CardHeader>
                                                                                              <CardTitle className="text-base">Choraklar bo&apos;yicha dinamika</CardTitle>CardTitle>
                                                                            </CardHeader>CardHeader>
                                                                            <CardContent className="p-12 text-center">
                                                                                              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                                                              <p className="text-muted-foreground">
                                                                                                                  Choraklar bo&apos;yicha taqqoslash grafigi
                                                                                                </p>p>
                                                                            </CardContent>CardContent>
                                                            </Card>Card>
                                                            <Card className="bg-card border-border">
                                                                            <CardHeader>
                                                                                              <CardTitle className="text-base">Sinflar taqqoslash</CardTitle>CardTitle>
                                                                            </CardHeader>CardHeader>
                                                                            <CardContent className="p-12 text-center">
                                                                                              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                                                              <p className="text-muted-foreground">
                                                                                                                  Sinflar o&apos;rtasidagi taqqoslash
                                                                                                </p>p>
                                                                            </CardContent>CardContent>
                                                            </Card>Card>
                                              </div>div>
                                  </TabsContent>TabsContent>
                        </Tabs>Tabs>
                
                        <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
                                  <DialogContent>
                                              <DialogHeader>
                                                            <DialogTitle>Baho qo&apos;yish</DialogTitle>DialogTitle>
                                              </DialogHeader>DialogHeader>
                                              <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                            <Label>O&apos;quvchi</Label>Label>
                                                                            <Select
                                                                                                value={gradeForm.student_id}
                                                                                                onValueChange={(v) => setGradeForm((p) => ({ ...p, student_id: v }))}
                                                                                              >
                                                                                              <SelectTrigger>
                                                                                                                  <SelectValue placeholder="O'quvchini tanlang" />
                                                                                                </SelectTrigger>SelectTrigger>
                                                                                              <SelectContent>
                                                                                                {classStudents.map((s) => (
                                                                                                                      <SelectItem key={s.id} value={s.id}>
                                                                                                                        {s.fullName}
                                                                                                                        </SelectItem>SelectItem>
                                                                                                                    ))}
                                                                                                </SelectContent>SelectContent>
                                                                            </Select>Select>
                                                            </div>div>
                                                            <div className="space-y-2">
                                                                            <Label>Fan</Label>Label>
                                                                            <Select
                                                                                                value={gradeForm.subject_id}
                                                                                                onValueChange={(v) => setGradeForm((p) => ({ ...p, subject_id: v }))}
                                                                                              >
                                                                                              <SelectTrigger>
                                                                                                                  <SelectValue placeholder="Fanni tanlang" />
                                                                                                </SelectTrigger>SelectTrigger>
                                                                                              <SelectContent>
                                                                                                {subjects.map((s) => (
                                                                                                                      <SelectItem key={s.id} value={s.id}>
                                                                                                                        {s.name}
                                                                                                                        </SelectItem>SelectItem>
                                                                                                                    ))}
                                                                                                </SelectContent>SelectContent>
                                                                            </Select>Select>
                                                            </div>div>
                                                            <div className="space-y-2">
                                                                            <Label>Ball (0-100)</Label>Label>
                                                                            <Input
                                                                                                type="number"
                                                                                                min={0}
                                                                                                max={100}
                                                                                                value={gradeForm.score}
                                                                                                onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                                                                                              />
                                                            </div>div>
                                              </div>div>
                                    {saveMessage && (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                            {saveMessage}
                          </p>p>
                                              )}
                                              <DialogFooter>
                                                            <Button variant="outline" onClick={() => setIsGradeModalOpen(false)}>
                                                                            Bekor qilish
                                                            </Button>Button>
                                                            <Button onClick={() => handleSaveGrade()} disabled={isSaving}>
                                                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                                            Saqlash
                                                            </Button>Button>
                                              </DialogFooter>DialogFooter>
                                  </DialogContent>DialogContent>
                        </Dialog>Dialog>
                
                        <Dialog open={isBsbSetupOpen} onOpenChange={setIsBsbSetupOpen}>
                                  <DialogContent className="max-w-lg">
                                              <DialogHeader>
                                                            <DialogTitle>{bsbNumber}-BSB uchun mezonlarni tuzish</DialogTitle>DialogTitle>
                                              </DialogHeader>DialogHeader>
                                              <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                            <Label>BSB nomi (ixtiyoriy)</Label>Label>
                                                                            <Input
                                                                                                placeholder="Masalan: Kasrlar mavzusi bo'yicha BSB"
                                                                                                value={bsbSetupTitle}
                                                                                                onChange={(e) => setBsbSetupTitle(e.target.value)}
                                                                                              />
                                                            </div>div>
                                                            <div className="space-y-3">
                                                                            <Label>Baholash mezonlari</Label>Label>
                                                              {bsbSetupCriteria.map((criterion, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                                  <Input
                                                                          placeholder="Mezon nomi (masalan: Bilish va tushunish)"
                                                                          value={criterion.name}
                                                                          onChange={(e) => {
                                                                                                    const updated = [...bsbSetupCriteria]
                                                                                                                              updated[index] = { ...updated[index], name: e.target.value }
                                                                                                                                                        setBsbSetupCriteria(updated)
                                                                            }}
                                                                        />
                                                  <Input
                                                                          type="number"
                                                                          min={1}
                                                                          placeholder="Max ball"
                                                                          className="w-28"
                                                                          value={criterion.max_score}
                                                                          onChange={(e) => {
                                                                                                    const updated = [...bsbSetupCriteria]
                                                                                                                              updated[index] = { ...updated[index], max_score: e.target.value }
                                                                                                                                                        setBsbSetupCriteria(updated)
                                                                            }}
                                                                        />
                                                  <Button
                                                                          type="button"
                                                                          variant="ghost"
                                                                          size="icon"
                                                                          onClick={() => handleRemoveCriteriaRow(index)}
                                                                          disabled={bsbSetupCriteria.length === 1}
                                                                        >
                                                                        <X className="h-4 w-4" />
                                                  </Button>Button>
                              </div>div>
                            ))}
                                                                            <Button type="button" variant="outline" size="sm" onClick={handleAddCriteriaRow}>
                                                                                              <Plus className="mr-2 h-4 w-4" />
                                                                                              Mezon qo&apos;shish
                                                                            </Button>Button>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                              Umumiy maksimal ball:{" "}
                                                                              {bsbSetupCriteria.reduce((acc, c) => acc + (Number(c.max_score) || 0), 0)}
                                                                            </p>p>
                                                            </div>div>
                                              </div>div>
                                              <DialogFooter>
                                                            <Button variant="outline" onClick={() => setIsBsbSetupOpen(false)}>
                                                                            Bekor qilish
                                                            </Button>Button>
                                                            <Button onClick={() => handleCreateBsb()} disabled={isBsbSaving}>
                                                              {isBsbSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                                            Yaratish
                                                            </Button>Button>
                                              </DialogFooter>DialogFooter>
                                  </DialogContent>DialogContent>
                        </Dialog>Dialog>
                </main>main>
          </>>
        )
}
</></div>
