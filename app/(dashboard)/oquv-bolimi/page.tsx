"use client"

import { useState, useEffect, useRef } from "react"
import * as XLSX from "xlsx"
import {
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
  Loader2,
  Upload,
  FileSpreadsheet,
  Camera,
  Download,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface StudentRow {
  id: string
  full_name: string
  class_id: string | null
  className: string
  gender: "male" | "female" | null
  parent_name: string | null
  parent_phone: string | null
  status: string
  photo_url: string | null
}

export default function OquvBolimiPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [studentsList, setStudentsList] = useState<StudentRow[]>([])
  const [studentClassFilter, setStudentClassFilter] = useState("all")
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [classForm, setClassForm] = useState({ name: "", grade: "1", section: "A" })
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    class_id: "",
    gender: "male" as "male" | "female",
    parent_name: "",
    parent_phone: "",
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState("")
  const [newCredentials, setNewCredentials] = useState<{ name: string; username: string; password: string } | null>(
    null
  )
  const photoInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const fetchData = async () => {
    setIsLoading(true)
    const [classesRes, subjectsRes, studentsRes, gradesRes, attendanceRes, scheduleRes] =
      await Promise.all([
        supabase.from("classes").select("id, name, grade, section, student_count").order("grade").order("section"),
        supabase.from("subjects").select("id, name, description").order("name"),
        supabase
          .from("students")
          .select("id, full_name, class_id, gender, parent_name, parent_phone, status, photo_url, classes(name)")
          .order("full_name"),
        supabase.from("grades").select("student_id, score"),
        supabase.from("student_attendance").select("student_id, status"),
        supabase.from("schedule").select("id, subject_id"),
      ])

    const studentsRaw = (studentsRes.data || []) as unknown as Array<{
      id: string
      full_name: string
      class_id: string | null
      gender: "male" | "female" | null
      parent_name: string | null
      parent_phone: string | null
      status: string
      photo_url: string | null
      classes: { name: string } | null
    }>
    const grades = gradesRes.data || []
    const attendance = attendanceRes.data || []
    const schedule = scheduleRes.data || []

    const classesWithStats: ClassRow[] = (classesRes.data || []).map((cls) => {
      const classStudentIds = studentsRaw
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
    setStudentsList(
      studentsRaw.map((s) => ({
        id: s.id,
        full_name: s.full_name,
        class_id: s.class_id,
        className: s.classes?.name || "Belgilanmagan",
        gender: s.gender,
        parent_name: s.parent_name,
        parent_phone: s.parent_phone,
        status: s.status,
        photo_url: s.photo_url,
      }))
    )
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

  const handleSaveStudent = async () => {
    if (!studentForm.full_name || !studentForm.class_id) return
    setIsSaving(true)

    let photo_url: string | null = null
    if (photoFile) {
      setIsUploadingPhoto(true)
      const formData = new FormData()
      formData.append("file", photoFile)
      formData.append("folder", "students")
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (res.ok) photo_url = data.url
      } catch {
        // fotosuratsiz ham saqlashda davom etamiz
      }
      setIsUploadingPhoto(false)
    }

    const baseUsername = studentForm.full_name
      .trim()
      .split(/\s+/)[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
    const randomSuffix = Math.floor(100 + Math.random() * 900)
    const username = `${baseUsername || "talaba"}${randomSuffix}`
    const password = String(Math.floor(100000 + Math.random() * 900000))

    const { error } = await supabase.from("students").insert({
      full_name: studentForm.full_name,
      class_id: studentForm.class_id,
      gender: studentForm.gender,
      parent_name: studentForm.parent_name || null,
      parent_phone: studentForm.parent_phone || null,
      photo_url,
      username,
      password_hash: password,
    })
    setIsSaving(false)
    if (error) {
      setImportMessage("Xatolik: o'quvchi qo'shilmadi - " + error.message)
      return
    }
    setIsStudentModalOpen(false)
    setNewCredentials({ name: studentForm.full_name, username, password })
    setStudentForm({
      full_name: "",
      class_id: "",
      gender: "male",
      parent_name: "",
      parent_phone: "",
    })
    setPhotoFile(null)
    setPhotoPreview(null)
    fetchData()
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const normalizeGender = (value: string): "male" | "female" | null => {
    const v = value.trim().toLowerCase()
    if (["o'g'il", "ogil", "erkak", "male", "m", "o'g'il bola"].includes(v)) return "male"
    if (["qiz", "ayol", "female", "f", "qiz bola"].includes(v)) return "female"
    return null
  }

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    setImportMessage("")

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

      let successCount = 0
      let skippedCount = 0
      const toInsert: Array<Record<string, string | null>> = []

      for (const row of rows) {
        const fullName = (row["Ism"] || row["To'liq ism"] || row["F.I.Sh"] || "").toString().trim()
        const className = (row["Sinf"] || "").toString().trim()
        const matchedClass = classes.find(
          (c) => c.name.toLowerCase() === className.toLowerCase()
        )

        if (!fullName || !matchedClass) {
          skippedCount++
          continue
        }

        toInsert.push({
          full_name: fullName,
          class_id: matchedClass.id,
          gender: normalizeGender((row["Jins"] || "").toString()),
          parent_name: (row["Ota-ona"] || row["Ota-ona ismi"] || "").toString().trim() || null,
          parent_phone: (row["Telefon"] || "").toString().trim() || null,
        })
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from("students").insert(toInsert)
        if (!error) {
          successCount = toInsert.length
        } else {
          skippedCount += toInsert.length
        }
      }

      setImportMessage(
        `${successCount} ta o'quvchi muvaffaqiyatli qo'shildi${
          skippedCount > 0 ? `, ${skippedCount} ta qator o'tkazib yuborildi (sinf topilmadi yoki ism bo'sh)` : ""
        }.`
      )
      fetchData()
    } catch {
      setImportMessage("Faylni o'qishda xatolik yuz berdi. Excel shabloniga rioya qiling.")
    } finally {
      setIsImporting(false)
      if (excelInputRef.current) excelInputRef.current.value = ""
    }
  }

  const handleDownloadTemplate = () => {
    const sampleRows = [
      { Ism: "Aliyev Jasur", Sinf: classes[0]?.name || "5-A", Jins: "O'g'il", "Ota-ona": "Aliyev Botir", Telefon: "+998901234567" },
    ]
    const worksheet = XLSX.utils.json_to_sheet(sampleRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "O'quvchilar")
    XLSX.writeFile(workbook, "oquvchilar_shabloni.xlsx")
  }

  const handleDeleteStudent = async (id: string) => {
    await supabase.from("students").delete().eq("id", id)
    fetchData()
  }

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSubjects = subjects.filter((subj) =>
    subj.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredStudents = studentsList
    .filter((s) => studentClassFilter === "all" || s.class_id === studentClassFilter)
    .filter((s) => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()))

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

        <Dialog open={isStudentModalOpen} onOpenChange={setIsStudentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>O&apos;quvchi qo&apos;shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {photoPreview ? (
                    <AvatarImage src={photoPreview} alt="Fotosurat" />
                  ) : (
                    <AvatarFallback className="bg-muted">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Fotosurat tanlash
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    FaceID tizimi uchun aniq, old tomondan olingan rasm tavsiya etiladi
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>To&apos;liq ism</Label>
                <Input
                  placeholder="Masalan: Aliyev Jasur"
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm((p) => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Sinf</Label>
                <Select
                  value={studentForm.class_id}
                  onValueChange={(v) => setStudentForm((p) => ({ ...p, class_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sinfni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jinsi</Label>
                <Select
                  value={studentForm.gender}
                  onValueChange={(v) => setStudentForm((p) => ({ ...p, gender: v as "male" | "female" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">O&apos;g&apos;il</SelectItem>
                    <SelectItem value="female">Qiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ota-ona ismi</Label>
                  <Input
                    value={studentForm.parent_name}
                    onChange={(e) => setStudentForm((p) => ({ ...p, parent_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    placeholder="+998 90 123 45 67"
                    value={studentForm.parent_phone}
                    onChange={(e) => setStudentForm((p) => ({ ...p, parent_phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsStudentModalOpen(false)
                  setPhotoFile(null)
                  setPhotoPreview(null)
                }}
              >
                Bekor qilish
              </Button>
              <Button onClick={handleSaveStudent} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUploadingPhoto ? "Fotosurat yuklanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tablar */}
        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="classes">Sinflar</TabsTrigger>
            <TabsTrigger value="students">O&apos;quvchilar</TabsTrigger>
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

          <TabsContent value="students">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">O&apos;quvchilar ro&apos;yxati</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Barcha sinflar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha sinflar</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Shablon
                  </Button>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelImport}
                  />
                  <Button
                    variant="outline"
                    onClick={() => excelInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                    )}
                    Excel&apos;dan import
                  </Button>
                  <Button onClick={() => setIsStudentModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    O&apos;quvchi qo&apos;shish
                  </Button>
                </div>
              </CardHeader>
              {importMessage && (
                <div className="px-6 pb-2">
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                    {importMessage}
                  </p>
                </div>
              )}
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>O&apos;quvchi</TableHead>
                      <TableHead>Sinf</TableHead>
                      <TableHead>Jinsi</TableHead>
                      <TableHead>Ota-ona</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          O&apos;quvchilar topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredStudents.map((s) => (
                      <TableRow key={s.id} className="border-border">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {s.photo_url ? (
                                <AvatarImage src={s.photo_url} alt={s.full_name} />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {s.full_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            {s.full_name}
                          </div>
                        </TableCell>
                        <TableCell>{s.className}</TableCell>
                        <TableCell>{s.gender === "male" ? "O'g'il" : s.gender === "female" ? "Qiz" : "—"}</TableCell>
                        <TableCell>{s.parent_name || "—"}</TableCell>
                        <TableCell>{s.parent_phone || "—"}</TableCell>
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
                                onClick={() => handleDeleteStudent(s.id)}
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

        <Dialog open={!!newCredentials} onOpenChange={(open) => !open && setNewCredentials(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>O&apos;quvchi qo&apos;shildi</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {newCredentials?.name} uchun tizimga kirish ma&apos;lumotlari yaratildi. Buni o&apos;quvchi/ota-onaga
                yetkazing — bu ma&apos;lumot faqat shu safar ko&apos;rsatiladi.
              </p>
              <div className="bg-muted/50 rounded-md p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Login:</span>
                  <span className="font-mono font-semibold">{newCredentials?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parol:</span>
                  <span className="font-mono font-semibold">{newCredentials?.password}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O&apos;quvchi shu login/parol bilan{" "}
                <span className="font-mono">156-maktab.uz/talaba/login</span> orqali kiradi.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewCredentials(null)}>Tushunarli</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
