"use client"

import { useState, useEffect, use } from "react"
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "free_response"

interface Option {
  id: string
  text: string
}

interface Question {
  id: string
  question_type: QuestionType
  question_text: string
  options: Option[] | null
  correct_answer: string | null
  points: number
}

interface StudentOption {
  id: string
  full_name: string
}

type ViewState = "loading" | "not_found" | "pick_student" | "test" | "done"

export default function StudentTestPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [view, setView] = useState<ViewState>("loading")
  const [assessment, setAssessment] = useState<{
    id: string
    title: string
    instructions: string | null
    class_id: string
  } | null>(null)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [finalScore, setFinalScore] = useState<{ score: number; max: number } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: assessmentData } = await supabase
        .from("assessments")
        .select("id, title, instructions, class_id, status")
        .eq("join_code", code)
        .maybeSingle()

      if (!assessmentData || assessmentData.status !== "published") {
        setView("not_found")
        return
      }

      setAssessment(assessmentData)

      const [studentsRes, questionsRes] = await Promise.all([
        supabase.from("students").select("id, full_name").eq("class_id", assessmentData.class_id).order("full_name"),
        supabase
          .from("assessment_questions")
          .select("id, question_type, question_text, options, correct_answer, points")
          .eq("assessment_id", assessmentData.id)
          .order("order_index"),
      ])
      setStudents(studentsRes.data || [])
      setQuestions((questionsRes.data as Question[]) || [])
      setView("pick_student")
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  const handleStartTest = async () => {
    if (!selectedStudent || !assessment) return

    // Avval boshlangan urinish bo'lsa, davom ettiramiz
    const { data: existing } = await supabase
      .from("assessment_submissions")
      .select("id, status")
      .eq("assessment_id", assessment.id)
      .eq("student_id", selectedStudent)
      .maybeSingle()

    if (existing && existing.status !== "in_progress") {
      setView("done")
      return
    }

    let subId = existing?.id
    if (!subId) {
      const { data: created } = await supabase
        .from("assessment_submissions")
        .insert({ assessment_id: assessment.id, student_id: selectedStudent, status: "in_progress" })
        .select("id")
        .single()
      subId = created?.id
    }

    setSubmissionId(subId || null)
    setView("test")
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmitTest = async () => {
    if (!submissionId || !assessment) return
    setIsSubmitting(true)

    let earnedScore = 0
    let maxScore = 0
    let hasManualGrading = false

    const responseRows = []
    for (const q of questions) {
      maxScore += q.points
      const answer = answers[q.id] || ""
      let isCorrect: boolean | null = null
      let pointsEarned = 0

      if (q.question_type === "multiple_choice" || q.question_type === "true_false") {
        isCorrect = answer !== "" && answer === q.correct_answer
        pointsEarned = isCorrect ? q.points : 0
      } else if (q.question_type === "short_answer") {
        isCorrect =
          answer.trim().toLowerCase() === (q.correct_answer || "").trim().toLowerCase()
        pointsEarned = isCorrect ? q.points : 0
      } else if (q.question_type === "free_response") {
        isCorrect = null
        hasManualGrading = true
      }

      responseRows.push({
        submission_id: submissionId,
        question_id: q.id,
        answer_text: answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      })
      earnedScore += pointsEarned
    }

    await supabase.from("assessment_responses").upsert(responseRows, { onConflict: "submission_id,question_id" })

    await supabase
      .from("assessment_submissions")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        max_score: maxScore,
        total_score: hasManualGrading ? null : earnedScore,
      })
      .eq("id", submissionId)

    setIsSubmitting(false)
    setFinalScore({ score: earnedScore, max: maxScore })
    setView("done")
  }

  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (view === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-medium mb-2">Test topilmadi</p>
            <p className="text-muted-foreground text-sm">
              Kirish kodi noto&apos;g&apos;ri yoki test hali e&apos;lon qilinmagan bo&apos;lishi mumkin.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === "pick_student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{assessment?.title}</CardTitle>
            {assessment?.instructions && (
              <p className="text-sm text-muted-foreground">{assessment.instructions}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ismingizni tanlang</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="O'zingizni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => handleStartTest()} disabled={!selectedStudent}>
              Testni boshlash
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <PartyPopper className="h-12 w-12 mx-auto text-primary" />
            <p className="text-lg font-medium">Test muvaffaqiyatli topshirildi!</p>
            {finalScore && (
              <p className="text-muted-foreground">
                Natijangiz o&apos;qituvchi tomonidan tekshirilgandan so&apos;ng e&apos;lon qilinadi.
              </p>
            )}
            <p className="text-sm text-muted-foreground">Bu sahifani yopishingiz mumkin.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // view === "test"
  const question = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{assessment?.title}</h1>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {question && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-normal">{question.question_text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {question.question_type === "multiple_choice" &&
                question.options?.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswerChange(question.id, opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      answers[question.id] === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {answers[question.id] === opt.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                      {opt.text}
                    </span>
                  </button>
                ))}

              {question.question_type === "true_false" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAnswerChange(question.id, "true")}
                    className={`flex-1 py-3 rounded-lg border ${
                      answers[question.id] === "true"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    To&apos;g&apos;ri
                  </button>
                  <button
                    onClick={() => handleAnswerChange(question.id, "false")}
                    className={`flex-1 py-3 rounded-lg border ${
                      answers[question.id] === "false"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    Noto&apos;g&apos;ri
                  </button>
                </div>
              )}

              {question.question_type === "short_answer" && (
                <Input
                  placeholder="Javobingizni yozing..."
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              )}

              {question.question_type === "free_response" && (
                <Textarea
                  placeholder="Batafsil javobingizni yozing..."
                  rows={6}
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Oldingi
          </Button>
          {isLast ? (
            <Button onClick={() => handleSubmitTest()} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Testni yakunlash
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>
              Keyingi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
