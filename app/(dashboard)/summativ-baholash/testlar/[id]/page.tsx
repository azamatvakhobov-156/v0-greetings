"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Radio,
  Type,
  AlignLeft,
  Copy,
  Rocket,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

const questionTypeLabels: Record<QuestionType, { label: string; icon: typeof Radio }> = {
  multiple_choice: { label: "Ko'p tanlovli", icon: Radio },
  true_false: { label: "To'g'ri / Noto'g'ri", icon: CheckCircle2 },
  short_answer: { label: "Qisqa javob", icon: Type },
  free_response: { label: "Erkin javob", icon: AlignLeft },
}

export default function TestBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [assessment, setAssessment] = useState<{
    title: string
    status: string
    join_code: string | null
  } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newType, setNewType] = useState<QuestionType>("multiple_choice")
  const [newText, setNewText] = useState("")
  const [newOptions, setNewOptions] = useState<string[]>(["", "", "", ""])
  const [newCorrectIndex, setNewCorrectIndex] = useState(0)
  const [newTrueFalseAnswer, setNewTrueFalseAnswer] = useState("true")
  const [newShortAnswer, setNewShortAnswer] = useState("")
  const [newPoints, setNewPoints] = useState("1")

  const supabase = createClient()

  const fetchData = async () => {
    setIsLoading(true)
    const [assessmentRes, questionsRes] = await Promise.all([
      supabase.from("assessments").select("title, status, join_code").eq("id", id).single(),
      supabase.from("assessment_questions").select("*").eq("assessment_id", id).order("order_index"),
    ])
    if (assessmentRes.data) setAssessment(assessmentRes.data)
    setQuestions((questionsRes.data as Question[]) || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const resetForm = () => {
    setNewType("multiple_choice")
    setNewText("")
    setNewOptions(["", "", "", ""])
    setNewCorrectIndex(0)
    setNewTrueFalseAnswer("true")
    setNewShortAnswer("")
    setNewPoints("1")
  }

  const handleAddQuestion = async () => {
    if (!newText) return
    setIsSaving(true)

    let options: Option[] | null = null
    let correct_answer: string | null = null

    if (newType === "multiple_choice") {
      const validOptions = newOptions.filter((o) => o.trim() !== "")
      if (validOptions.length < 2) {
        setIsSaving(false)
        setMessage("Kamida 2 ta variant kiriting")
        return
      }
      options = validOptions.map((text, i) => ({ id: String(i), text }))
      correct_answer = String(newCorrectIndex)
    } else if (newType === "true_false") {
      correct_answer = newTrueFalseAnswer
    } else if (newType === "short_answer") {
      correct_answer = newShortAnswer
    }

    const { error } = await supabase.from("assessment_questions").insert({
      assessment_id: id,
      question_type: newType,
      question_text: newText,
      options,
      correct_answer,
      points: Number(newPoints) || 1,
      order_index: questions.length,
    })

    setIsSaving(false)
    if (error) {
      setMessage("Xatolik: " + error.message)
      return
    }
    setIsAddOpen(false)
    resetForm()
    fetchData()
  }

  const handleDeleteQuestion = async (qid: string) => {
    await supabase.from("assessment_questions").delete().eq("id", qid)
    fetchData()
  }

  const handlePublish = async () => {
    setIsSaving(true)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const { error } = await supabase
      .from("assessments")
      .update({ status: "published", join_code: code })
      .eq("id", id)
    setIsSaving(false)
    if (error) {
      setMessage("Xatolik: " + error.message)
      return
    }
    fetchData()
  }

  const handleClose = async () => {
    setIsSaving(true)
    await supabase.from("assessments").update({ status: "closed" }).eq("id", id)
    setIsSaving(false)
    fetchData()
  }

  const totalPoints = questions.reduce((acc, q) => acc + q.points, 0)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Header title={assessment?.title || "Test"} description="Savollarni qo'shing va testni e'lon qiling" />

      <main className="flex-1 p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/summativ-baholash/testlar")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Testlar ro&apos;yxatiga qaytish
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge
              className={
                assessment?.status === "published"
                  ? "bg-chart-2/10 text-chart-2"
                  : assessment?.status === "closed"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
              }
            >
              {assessment?.status === "published"
                ? "E'lon qilingan"
                : assessment?.status === "closed"
                ? "Yopilgan"
                : "Qoralama"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {questions.length} savol · Jami {totalPoints} ball
            </span>
          </div>
          <div className="flex gap-2">
            {assessment?.status === "draft" && (
              <Button onClick={() => handlePublish()} disabled={isSaving || questions.length === 0}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                E&apos;lon qilish
              </Button>
            )}
            {assessment?.status === "published" && (
              <Button variant="outline" onClick={() => handleClose()} disabled={isSaving}>
                Testni yopish
              </Button>
            )}
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Savol qo&apos;shish
            </Button>
          </div>
        </div>

        {assessment?.join_code && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">O&apos;quvchilar uchun kirish kodi</p>
                <p className="text-3xl font-mono font-bold tracking-widest">{assessment.join_code}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => navigator.clipboard.writeText(assessment.join_code!)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Nusxalash
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/summativ-baholash/testlar/${id}/natijalar`)}
              >
                Natijalarni ko&apos;rish
              </Button>
            </CardContent>
          </Card>
        )}

        {message && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">{message}</p>
        )}

        <div className="space-y-3">
          {questions.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center text-muted-foreground">
                Hali savollar qo&apos;shilmagan
              </CardContent>
            </Card>
          )}
          {questions.map((q, index) => {
            const TypeIcon = questionTypeLabels[q.question_type].icon
            return (
              <Card key={q.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground font-medium">{index + 1}.</span>
                      <Badge variant="secondary" className="gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {questionTypeLabels[q.question_type].label}
                      </Badge>
                      <Badge variant="outline">{q.points} ball</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteQuestion(q.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-3">{q.question_text}</p>
                  {q.question_type === "multiple_choice" && q.options && (
                    <div className="space-y-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`text-sm px-3 py-1.5 rounded-md ${
                            opt.id === q.correct_answer
                              ? "bg-chart-2/10 text-chart-2 font-medium"
                              : "bg-muted/50"
                          }`}
                        >
                          {opt.text} {opt.id === q.correct_answer && "✓"}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.question_type === "true_false" && (
                    <Badge className="bg-chart-2/10 text-chart-2">
                      To&apos;g&apos;ri javob: {q.correct_answer === "true" ? "To'g'ri" : "Noto'g'ri"}
                    </Badge>
                  )}
                  {q.question_type === "short_answer" && (
                    <Badge className="bg-chart-2/10 text-chart-2">To&apos;g&apos;ri javob: {q.correct_answer}</Badge>
                  )}
                  {q.question_type === "free_response" && (
                    <p className="text-xs text-muted-foreground">Qo&apos;lda tekshiriladi</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi savol qo&apos;shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label>Savol turi</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as QuestionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Ko&apos;p tanlovli</SelectItem>
                    <SelectItem value="true_false">To&apos;g&apos;ri / Noto&apos;g&apos;ri</SelectItem>
                    <SelectItem value="short_answer">Qisqa javob</SelectItem>
                    <SelectItem value="free_response">Erkin javob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Savol matni</Label>
                <Textarea
                  placeholder="Savolni yozing..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
              </div>

              {newType === "multiple_choice" && (
                <div className="space-y-2">
                  <Label>Variantlar (to&apos;g&apos;risini belgilang)</Label>
                  {newOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={newCorrectIndex === i}
                        onChange={() => setNewCorrectIndex(i)}
                      />
                      <Input
                        placeholder={`Variant ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newOptions]
                          updated[i] = e.target.value
                          setNewOptions(updated)
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {newType === "true_false" && (
                <div className="space-y-2">
                  <Label>To&apos;g&apos;ri javob</Label>
                  <Select value={newTrueFalseAnswer} onValueChange={setNewTrueFalseAnswer}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">To&apos;g&apos;ri</SelectItem>
                      <SelectItem value="false">Noto&apos;g&apos;ri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newType === "short_answer" && (
                <div className="space-y-2">
                  <Label>To&apos;g&apos;ri javob (matn)</Label>
                  <Input
                    placeholder="Masalan: Toshkent"
                    value={newShortAnswer}
                    onChange={(e) => setNewShortAnswer(e.target.value)}
                  />
                </div>
              )}

              {newType === "free_response" && (
                <p className="text-xs text-muted-foreground">
                  Bu turdagi savolni o&apos;qituvchi qo&apos;lda tekshiradi va ball qo&apos;yadi
                </p>
              )}

              <div className="space-y-2">
                <Label>Ball</Label>
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={() => handleAddQuestion()} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Qo&apos;shish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
