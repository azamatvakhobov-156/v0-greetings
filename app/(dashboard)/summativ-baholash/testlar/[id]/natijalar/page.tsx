"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    Users,
    BarChart3,
    Send,
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface Question {
    id: string
    question_type: string
    question_text: string
    points: number
}

interface Response {
    id: string
    question_id: string
    answer_text: string | null
    is_correct: boolean | null
    points_earned: number | null
}

interface Submission {
    id: string
    student_id: string
    studentName: string
    status: string
    total_score: number | null
    max_score: number | null
    responses: Response[]
}

export default function TestResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [assessment, setAssessment] = useState<{
          title: string
          subject_id: string
          quarter: number
          assessment_type: string
          bsb_number: number | null
    } | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])

  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null)
    const [manualScores, setManualScores] = useState<Record<string, string>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState("")

  const supabase = createClient()

  const fetchData = async () => {
        setIsLoading(true)
        const { data: assessmentData } = await supabase
          .from("assessments")
          .select("title, subject_id, quarter, assessment_type, bsb_number")
          .eq("id", id)
          .single()
        setAssessment(assessmentData)

        const { data: questionsData } = await supabase
          .from("assessment_questions")
          .select("id, question_type, question_text, points")
          .eq("assessment_id", id)
          .order("order_index")
        setQuestions(questionsData || [])

        const { data: submissionsData } = await supabase
          .from("assessment_submissions")
          .select("id, student_id, status, total_score, max_score, students(full_name)")
          .eq("assessment_id", id)

        const subs = (submissionsData || []) as unknown as Array<{
                id: string
                student_id: string
                status: string
                total_score: number | null
                max_score: number | null
                students: { full_name: string } | null
        }>

        const subIds = subs.map((s) => s.id)
        let responsesBySubmission: Record<string, Response[]> = {}
              if (subIds.length > 0) {
                      const { data: responsesData } = await supabase
                        .from("assessment_responses")
                        .select("id, submission_id, question_id, answer_text, is_correct, points_earned")
                        .in("submission_id", subIds)
                      ;(responsesData || []).forEach((r) => {
                                if (!responsesBySubmission[r.submission_id]) responsesBySubmission[r.submission_id] = []
                                          responsesBySubmission[r.submission_id].push(r)
                      })
              }

        setSubmissions(
                subs.map((s) => ({
                          id: s.id,
                          student_id: s.student_id,
                          studentName: s.students?.full_name || "Noma'lum",
                          status: s.status,
                          total_score: s.total_score,
                          max_score: s.max_score,
                          responses: responsesBySubmission[s.id] || [],
                }))
              )
        setIsLoading(false)
  }

  useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const openGrading = (submission: Submission) => {
        setGradingSubmission(submission)
        const initial: Record<string, string> = {}
              submission.responses.forEach((r) => {
                      initial[r.question_id] = String(r.points_earned ?? 0)
              })
        setManualScores(initial)
  }

  const handleSaveManualGrading = async () => {
        if (!gradingSubmission) return
        setIsSaving(true)

        for (const r of gradingSubmission.responses) {
                const points = Number(manualScores[r.question_id] || 0)
                const question = questions.find((q) => q.id === r.question_id)
                await supabase
                  .from("assessment_responses")
                  .update({ points_earned: points, is_correct: question ? points >= question.points : null })
                  .eq("id", r.id)
        }

        const total = gradingSubmission.responses.reduce(
                (acc, r) => acc + Number(manualScores[r.question_id] || 0),
                0
              )
        await supabase
          .from("assessment_submissions")
          .update({ total_score: total, status: "graded" })
          .eq("id", gradingSubmission.id)

        if (assessment) {
                const maxScore = gradingSubmission.max_score || questions.reduce((a, q) => a + q.points, 0)
                const scoreOn100 = maxScore > 0 ? (total / maxScore) * 100 : 0
                const gradeType =
                          assessment.assessment_type === "bsb" ? `bsb_${assessment.bsb_number || 1}` : `summative_${assessment.quarter}`
                await supabase.from("grades").upsert(
                  {
                              student_id: gradingSubmission.student_id,
                              subject_id: assessment.subject_id,
                              grade_type: gradeType,
                              score: scoreOn100,
                              quarter: assessment.quarter,
                  },
                  { onConflict: "student_id,subject_id,grade_type,quarter" }
                        )
        }

        setIsSaving(false)
        setGradingSubmission(null)
        setMessage("Baholandi va saqlandi.")
        fetchData()
  }

  const gradedCount = submissions.filter((s) => s.status === "graded").length
    const submittedCount = submissions.filter((s) => s.status === "submitted" || s.status === "graded").length
    const avgScore =
          submissions.filter((s) => s.total_score !== null).length > 0
        ? submissions.reduce((acc, s) => acc + (s.total_score || 0), 0) /
              submissions.filter((s) => s.total_score !== null).length
            : 0

  if (isLoading) {
        return (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>div>
              )
  }
  
    return (
          <>
                <Header title={`Natijalar: ${assessment?.title || ""}`} description="O'quvchilar javoblari va baholash" />
          
                <main className="flex-1 p-6 space-y-6">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/summativ-baholash/testlar/${id}`)}>
                                  <ArrowLeft className="mr-2 h-4 w-4" />
                                  Testga qaytish
                        </Button>Button>
                
                  {message && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">{message}</p>p>
                        )}
                
                        <div className="grid gap-4 md:grid-cols-3">
                                  <Card className="bg-card border-border">
                                              <CardContent className="p-4 flex items-center justify-between">
                                                            <div>
                                                                            <p className="text-sm text-muted-foreground">Topshirdi</p>p>
                                                                            <p className="text-2xl font-bold">{submittedCount}</p>p>
                                                            </div>div>
                                                            <Users className="h-8 w-8 text-primary" />
                                              </CardContent>CardContent>
                                  </Card>Card>
                                  <Card className="bg-card border-border">
                                              <CardContent className="p-4 flex items-center justify-between">
                                                            <div>
                                                                            <p className="text-sm text-muted-foreground">Baholandi</p>p>
                                                                            <p className="text-2xl font-bold">{gradedCount}</p>p>
                                                            </div>div>
                                                            <CheckCircle2 className="h-8 w-8 text-chart-2" />
                                              </CardContent>CardContent>
                                  </Card>Card>
                                  <Card className="bg-card border-border">
                                              <CardContent className="p-4 flex items-center justify-between">
                                                            <div>
                                                                            <p className="text-sm text-muted-foreground">O&apos;rtacha ball</p>p>
                                                                            <p className="text-2xl font-bold">{avgScore.toFixed(1)}</p>p>
                                                            </div>div>
                                                            <BarChart3 className="h-8 w-8 text-chart-3" />
                                              </CardContent>CardContent>
                                  </Card>Card>
                        </div>div>
                
                        <Card className="bg-card border-border">
                                  <CardHeader>
                                              <CardTitle className="text-base">O&apos;quvchilar natijalari</CardTitle>CardTitle>
                                  </CardHeader>CardHeader>
                                  <CardContent>
                                              <Table>
                                                            <TableHeader>
                                                                            <TableRow className="border-border">
                                                                                              <TableHead>O&apos;quvchi</TableHead>TableHead>
                                                                                              <TableHead className="text-center">Holat</TableHead>TableHead>
                                                                                              <TableHead className="text-center">Ball</TableHead>TableHead>
                                                                                              <TableHead className="text-right">Amallar</TableHead>TableHead>
                                                                            </TableRow>TableRow>
                                                            </TableHeader>TableHeader>
                                                            <TableBody>
                                                              {submissions.length === 0 && (
                              <TableRow>
                                                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                                        Hali hech kim topshirmagan
                                                  </TableCell>TableCell>
                              </TableRow>TableRow>
                                                                            )}
                                                              {submissions.map((s) => (
                              <TableRow key={s.id} className="border-border">
                                                  <TableCell className="font-medium">{s.studentName}</TableCell>TableCell>
                                                  <TableCell className="text-center">
                                                                        <Badge
                                                                                                  className={
                                                                                                                              s.status === "graded"
                                                                                                                                ? "bg-chart-2/10 text-chart-2"
                                                                                                                                : s.status === "submitted"
                                                                                                                                ? "bg-chart-3/10 text-chart-3"
                                                                                                                                : "bg-muted text-muted-foreground"
                                                                                                    }
                                                                                                >
                                                                          {s.status === "graded" ? "Baholandi" : s.status === "submitted" ? "Topshirildi" : "Jarayonda"}
                                                                        </Badge>Badge>
                                                  </TableCell>TableCell>
                                                  <TableCell className="text-center">
                                                    {s.total_score !== null ? `${s.total_score} / ${s.max_score}` : "-"}
                                                  </TableCell>TableCell>
                                                  <TableCell className="text-right">
                                                    {s.status !== "in_progress" && (
                                                        <Button variant="outline" size="sm" onClick={() => openGrading(s)}>
                                                          {s.status === "graded" ? "Qayta ko'rish" : "Baholash"}
                                                        </Button>Button>
                                                                        )}
                                                  </TableCell>TableCell>
                              </TableRow>TableRow>
                            ))}
                                                            </TableBody>TableBody>
                                              </Table>Table>
                                  </CardContent>CardContent>
                        </Card>Card>
                
                        <Dialog open={!!gradingSubmission} onOpenChange={(open) => !open && setGradingSubmission(null)}>
                                  <DialogContent className="max-w-2xl">
                                              <DialogHeader>
                                                            <DialogTitle>{gradingSubmission?.studentName} - javoblarni baholash</DialogTitle>DialogTitle>
                                              </DialogHeader>DialogHeader>
                                              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                                                {gradingSubmission?.responses.map((r) => {
                            const question = questions.find((q) => q.id === r.question_id)
                                              if (!question) return null
                                                                return (
                                                                                    <Card key={r.id} className="bg-muted/30">
                                                                                                        <CardContent className="p-4 space-y-2">
                                                                                                                              <p className="text-sm font-medium">{question.question_text}</p>p>
                                                                                                                              <p className="text-sm text-muted-foreground bg-background rounded-md px-3 py-2">
                                                                                                                                {r.answer_text || "(javob berilmagan)"}
                                                                                                                                </p>p>
                                                                                                                              <div className="flex items-center gap-2">
                                                                                                                                {r.is_correct !== null && (
                                                                                                                r.is_correct ? (
                                                                                                                                              <CheckCircle2 className="h-4 w-4 text-chart-2" />
                                                                                                                                            ) : (
                                                                                                                                              <XCircle className="h-4 w-4 text-destructive" />
                                                                                                                                            )
                                                                                                              )}
                                                                                                                                                      <Input
                                                                                                                                                                                  type="number"
                                                                                                                                                                                  min={0}
                                                                                                                                                                                  max={question.points}
                                                                                                                                                                                  className="w-24"
                                                                                                                                                                                  value={manualScores[r.question_id] ?? ""}
                                                                                                                                                                                  onChange={(e) =>
                                                                                                                                                                                                                setManualScores((prev) => ({ ...prev, [r.question_id]: e.target.value }))
                                                                                                                                                                                                              }
                                                                                                                                                                                />
                                                                                                                                                      <span className="text-sm text-muted-foreground">/ {question.points} ball</span>span>
                                                                                                                                </div>div>
                                                                                                          </CardContent>CardContent>
                                                                                      </Card>Card>
                                                                                  )
                                                })}
                                              </div>div>
                                              <DialogFooter>
                                                            <Button variant="outline" onClick={() => setGradingSubmission(null)}>
                                                                            Bekor qilish
                                                            </Button>Button>
                                                            <Button onClick={() => handleSaveManualGrading()} disabled={isSaving}>
                                                              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                                                            Saqlash
                                                            </Button>Button>
                                              </DialogFooter>DialogFooter>
                                  </DialogContent>DialogContent>
                        </Dialog>Dialog>
                </main>main>
          </>>
        )
}
</></div>
