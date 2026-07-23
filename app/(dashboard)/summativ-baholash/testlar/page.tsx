"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    Loader2,
    FileQuestion,
    Users,
    Copy,
    MoreHorizontal,
    BarChart3,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

interface ClassOption {
    id: string
    name: string
}
interface SubjectOption {
    id: string
    name: string
}
interface AssessmentRow {
    id: string
    title: string
    assessment_type: "bsb" | "chsb"
    bsb_number: number | null
    status: "draft" | "published" | "closed"
    join_code: string | null
    className: string
    subjectName: string
    questionCount: number
    submissionCount: number
}

export default function TestlarPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [assessments, setAssessments] = useState<AssessmentRow[]>([])
    const [classes, setClasses] = useState<ClassOption[]>([])
    const [subjects, setSubjects] = useState<SubjectOption[]>([])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [form, setForm] = useState({
          title: "",
          subject_id: "",
          class_id: "",
          quarter: "1",
          assessment_type: "bsb" as "bsb" | "chsb",
          bsb_number: "1",
    })

  const supabase = createClient()

  const fetchData = async () => {
        setIsLoading(true)
        const [classesRes, subjectsRes, assessmentsRes] = await Promise.all([
                supabase.from("classes").select("id, name").gte("grade", 5).lte("grade", 11).order("grade").order("section"),
                supabase.from("subjects").select("id, name").order("name"),
                supabase
                  .from("assessments")
                  .select("id, title, assessment_type, bsb_number, status, join_code, classes(name), subjects(name)")
                  .order("created_at", { ascending: false }),
              ])

        setClasses(classesRes.data || [])
        setSubjects(subjectsRes.data || [])

        const rawAssessments = (assessmentsRes.data || []) as unknown as Array<{
                id: string
                title: string
                assessment_type: "bsb" | "chsb"
                bsb_number: number | null
                status: "draft" | "published" | "closed"
                join_code: string | null
                classes: { name: string } | null
                subjects: { name: string } | null
        }>

        const ids = rawAssessments.map((a) => a.id)
        let questionCounts: Record<string, number> = {}
              let submissionCounts: Record<string, number> = {}

                    if (ids.length > 0) {
                            const [qRes, sRes] = await Promise.all([
                                      supabase.from("assessment_questions").select("assessment_id").in("assessment_id", ids),
                                      supabase.from("assessment_submissions").select("assessment_id").in("assessment_id", ids),
                                    ])
                            ;(qRes.data || []).forEach((q) => {
                                      questionCounts[q.assessment_id] = (questionCounts[q.assessment_id] || 0) + 1
                            })
                            ;(sRes.data || []).forEach((s) => {
                                      submissionCounts[s.assessment_id] = (submissionCounts[s.assessment_id] || 0) + 1
                            })
                    }

        setAssessments(
                rawAssessments.map((a) => ({
                          id: a.id,
                          title: a.title,
                          assessment_type: a.assessment_type,
                          bsb_number: a.bsb_number,
                          status: a.status,
                          join_code: a.join_code,
                          className: a.classes?.name || "-",
                          subjectName: a.subjects?.name || "-",
                          questionCount: questionCounts[a.id] || 0,
                          submissionCount: submissionCounts[a.id] || 0,
                }))
              )
        setIsLoading(false)
  }

  useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async () => {
        if (!form.title || !form.subject_id || !form.class_id) return
        setIsSaving(true)
        const { data, error } = await supabase
          .from("assessments")
          .insert({
                    title: form.title,
                    subject_id: form.subject_id,
                    class_id: form.class_id,
                    quarter: Number(form.quarter),
                    assessment_type: form.assessment_type,
                    bsb_number: form.assessment_type === "bsb" ? Number(form.bsb_number) : null,
                    status: "draft",
          })
          .select("id")
          .single()
        setIsSaving(false)
        if (error || !data) return
        setIsCreateOpen(false)
        router.push(`/summativ-baholash/testlar/${data.id}`)
  }

  const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
  }

  const statusConfig = {
        draft: { label: "Qoralama", className: "bg-muted text-muted-foreground" },
        published: { label: "E'lon qilingan", className: "bg-chart-2/10 text-chart-2" },
        closed: { label: "Yopilgan", className: "bg-destructive/10 text-destructive" },
  }

  if (isLoading) {
        return (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>div>
              )
  }
  
    return (
          <>
                <Header
                          title="Testlar"
                          description="BSB va ChSB uchun interaktiv testlar yaratish va boshqarish"
                        />
          
                <main className="flex-1 p-6 space-y-6">
                        <div className="flex justify-between items-center">
                                  <p className="text-sm text-muted-foreground">
                                              O&apos;quvchilar kirish kodi orqali testni to&apos;g&apos;ridan-to&apos;g&apos;ri brauzerda topshiradi
                                  </p>p>
                                  <Button onClick={() => setIsCreateOpen(true)}>
                                              <Plus className="mr-2 h-4 w-4" />
                                              Yangi test
                                  </Button>Button>
                        </div>div>
                
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {assessments.length === 0 && (
                        <Card className="bg-card border-border md:col-span-2 lg:col-span-3">
                                      <CardContent className="p-12 text-center">
                                                      <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                      <p className="text-muted-foreground">Hali testlar yaratilmagan</p>p>
                                      </CardContent>CardContent>
                        </Card>Card>
                                  )}
                          {assessments.map((a) => {
                        const cfg = statusConfig[a.status]
                                      return (
                                                      <Card key={a.id} className="bg-card border-border">
                                                                      <CardHeader className="pb-3">
                                                                                        <div className="flex items-start justify-between">
                                                                                                            <div>
                                                                                                                                  <CardTitle className="text-base">{a.title}</CardTitle>CardTitle>
                                                                                                                                  <p className="text-xs text-muted-foreground mt-1">
                                                                                                                                    {a.subjectName} · {a.className} ·{" "}
                                                                                                                                    {a.assessment_type === "bsb" ? `${a.bsb_number}-BSB` : "ChSB"}
                                                                                                                                    </p>p>
                                                                                                              </div>div>
                                                                                                            <DropdownMenu>
                                                                                                                                  <DropdownMenuTrigger asChild>
                                                                                                                                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                                                                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                                                                                            </Button>Button>
                                                                                                                                    </DropdownMenuTrigger>DropdownMenuTrigger>
                                                                                                                                  <DropdownMenuContent align="end">
                                                                                                                                                          <DropdownMenuItem onClick={() => router.push(`/summativ-baholash/testlar/${a.id}`)}>
                                                                                                                                                                                    Tahrirlash
                                                                                                                                                            </DropdownMenuItem>DropdownMenuItem>
                                                                                                                                    </DropdownMenuContent>DropdownMenuContent>
                                                                                                              </DropdownMenu>DropdownMenu>
                                                                                          </div>div>
                                                                      </CardHeader>CardHeader>
                                                                      <CardContent className="space-y-3">
                                                                                        <Badge className={cfg.className}>{cfg.label}</Badge>Badge>
                                                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                                                            <span className="flex items-center gap-1">
                                                                                                                                  <FileQuestion className="h-3.5 w-3.5" />
                                                                                                              {a.questionCount} savol
                                                                                                              </span>span>
                                                                                                            <span className="flex items-center gap-1">
                                                                                                                                  <Users className="h-3.5 w-3.5" />
                                                                                                              {a.submissionCount} topshirdi
                                                                                                              </span>span>
                                                                                          </div>div>
                                                                        {a.join_code && (
                                                                            <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                                                                                                  <span className="text-xs text-muted-foreground">Kirish kodi:</span>span>
                                                                                                  <span className="font-mono font-semibold text-lg">{a.join_code}</span>span>
                                                                                                  <Button
                                                                                                                            variant="ghost"
                                                                                                                            size="icon"
                                                                                                                            className="h-6 w-6 ml-auto"
                                                                                                                            onClick={() => handleCopyCode(a.join_code!)}
                                                                                                                          >
                                                                                                                          <Copy className="h-3.5 w-3.5" />
                                                                                                    </Button>Button>
                                                                            </div>div>
                                                                                        )}
                                                                                        <div className="flex gap-2">
                                                                                                            <Button
                                                                                                                                    variant="outline"
                                                                                                                                    size="sm"
                                                                                                                                    className="flex-1"
                                                                                                                                    onClick={() => router.push(`/summativ-baholash/testlar/${a.id}`)}
                                                                                                                                  >
                                                                                                                                  Tahrirlash
                                                                                                              </Button>Button>
                                                                                                            <Button
                                                                                                                                    variant="outline"
                                                                                                                                    size="sm"
                                                                                                                                    className="flex-1"
                                                                                                                                    onClick={() => router.push(`/summativ-baholash/testlar/${a.id}/natijalar`)}
                                                                                                                                  >
                                                                                                                                  <BarChart3 className="mr-1 h-3.5 w-3.5" />
                                                                                                                                  Natijalar
                                                                                                              </Button>Button>
                                                                                          </div>div>
                                                                      </CardContent>CardContent>
                                                      </Card>Card>
                                                    )
                          })}
                        </div>div>
                
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                  <DialogContent>
                                              <DialogHeader>
                                                            <DialogTitle>Yangi test yaratish</DialogTitle>DialogTitle>
                                              </DialogHeader>DialogHeader>
                                              <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                            <Label>Test nomi</Label>Label>
                                                                            <Input
                                                                                                placeholder="Masalan: Kasrlar mavzusi bo'yicha BSB"
                                                                                                value={form.title}
                                                                                                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                                                                              />
                                                            </div>div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                            <div className="space-y-2">
                                                                                              <Label>Fan</Label>Label>
                                                                                              <Select value={form.subject_id} onValueChange={(v) => setForm((p) => ({ ...p, subject_id: v }))}>
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
                                                                                              <Label>Sinf</Label>Label>
                                                                                              <Select value={form.class_id} onValueChange={(v) => setForm((p) => ({ ...p, class_id: v }))}>
                                                                                                                  <SelectTrigger>
                                                                                                                                        <SelectValue placeholder="Sinfni tanlang" />
                                                                                                                    </SelectTrigger>SelectTrigger>
                                                                                                                  <SelectContent>
                                                                                                                    {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.name}
                                    </SelectItem>SelectItem>
                                  ))}
                                                                                                                    </SelectContent>SelectContent>
                                                                                                </Select>Select>
                                                                            </div>div>
                                                            </div>div>
                                                            <div className="grid grid-cols-3 gap-4">
                                                                            <div className="space-y-2">
                                                                                              <Label>Chorak</Label>Label>
                                                                                              <Select value={form.quarter} onValueChange={(v) => setForm((p) => ({ ...p, quarter: v }))}>
                                                                                                                  <SelectTrigger>
                                                                                                                                        <SelectValue />
                                                                                                                    </SelectTrigger>SelectTrigger>
                                                                                                                  <SelectContent>
                                                                                                                                        <SelectItem value="1">I chorak</SelectItem>SelectItem>
                                                                                                                                        <SelectItem value="2">II chorak</SelectItem>SelectItem>
                                                                                                                                        <SelectItem value="3">III chorak</SelectItem>SelectItem>
                                                                                                                                        <SelectItem value="4">IV chorak</SelectItem>SelectItem>
                                                                                                                    </SelectContent>SelectContent>
                                                                                                </Select>Select>
                                                                            </div>div>
                                                                            <div className="space-y-2">
                                                                                              <Label>Turi</Label>Label>
                                                                                              <Select
                                                                                                                    value={form.assessment_type}
                                                                                                                    onValueChange={(v) => setForm((p) => ({ ...p, assessment_type: v as "bsb" | "chsb" }))}
                                                                                                                  >
                                                                                                                  <SelectTrigger>
                                                                                                                                        <SelectValue />
                                                                                                                    </SelectTrigger>SelectTrigger>
                                                                                                                  <SelectContent>
                                                                                                                                        <SelectItem value="bsb">BSB</SelectItem>SelectItem>
                                                                                                                                        <SelectItem value="chsb">ChSB</SelectItem>SelectItem>
                                                                                                                    </SelectContent>SelectContent>
                                                                                                </Select>Select>
                                                                            </div>div>
                                                              {form.assessment_type === "bsb" && (
                              <div className="space-y-2">
                                                  <Label>BSB raqami</Label>Label>
                                                  <Select value={form.bsb_number} onValueChange={(v) => setForm((p) => ({ ...p, bsb_number: v }))}>
                                                                        <SelectTrigger>
                                                                                                <SelectValue />
                                                                        </SelectTrigger>SelectTrigger>
                                                                        <SelectContent>
                                                                                                <SelectItem value="1">1-BSB</SelectItem>SelectItem>
                                                                                                <SelectItem value="2">2-BSB</SelectItem>SelectItem>
                                                                                                <SelectItem value="3">3-BSB</SelectItem>SelectItem>
                                                                        </SelectContent>SelectContent>
                                                  </Select>Select>
                              </div>div>
                                                                            )}
                                                            </div>div>
                                              </div>div>
                                              <DialogFooter>
                                                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                                                            Bekor qilish
                                                            </Button>Button>
                                                            <Button onClick={() => handleCreate()} disabled={isSaving}>
                                                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                                            Yaratish va savol qo&apos;shish
                                                            </Button>Button>
                                              </DialogFooter>DialogFooter>
                                  </DialogContent>DialogContent>
                        </Dialog>Dialog>
                </main>main>
          </>>
        )
}
</></div>
