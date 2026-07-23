"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  LogOut,
  FileQuestion,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface StudentSession {
  id: string
  full_name: string
  class_id: string
  username: string
}

interface AvailableTest {
  id: string
  title: string
  join_code: string
  subjectName: string
  submissionStatus: string | null
}

interface ResultRow {
  id: string
  title: string
  subjectName: string
  status: string
  total_score: number | null
  max_score: number | null
}

export default function StudentPortalPage() {
  const router = useRouter()
  const [student, setStudent] = useState<StudentSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([])
  const [results, setResults] = useState<ResultRow[]>([])

  const supabase = createClient()

  useEffect(() => {
    const studentStr = localStorage.getItem("student")
    if (!studentStr) {
      router.push("/talaba/login")
      return
    }
    const s = JSON.parse(studentStr)
    setStudent(s)
    loadData(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async (s: StudentSession) => {
    setIsLoading(true)

    const { data: assessmentsData } = await supabase
      .from("assessments")
      .select("id, title, join_code, subjects(name)")
      .eq("class_id", s.class_id)
      .eq("status", "published")

    const assessments = (assessmentsData || []) as unknown as Array<{
      id: string
      title: string
      join_code: string
      subjects: { name: string } | null
    }>

    const { data: submissionsData } = await supabase
      .from("assessment_submissions")
      .select("id, assessment_id, status, total_score, max_score")
      .eq("student_id", s.id)

    const submissions = submissionsData || []
    const submissionByAssessment = new Map(submissions.map((sub) => [sub.assessment_id, sub]))

    setAvailableTests(
      assessments
        .filter((a) => {
          const sub = submissionByAssessment.get(a.id)
          return !sub || sub.status === "in_progress"
        })
        .map((a) => ({
          id: a.id,
          title: a.title,
          join_code: a.join_code,
          subjectName: a.subjects?.name || "",
          submissionStatus: submissionByAssessment.get(a.id)?.status || null,
        }))
    )

    const { data: allAssessmentsForResults } = await supabase
      .from("assessments")
      .select("id, title, subjects(name)")

    const assessmentsMap = new Map(
      ((allAssessmentsForResults || []) as unknown as Array<{
        id: string
        title: string
        subjects: { name: string } | null
      }>).map((a) => [a.id, a])
    )

    setResults(
      submissions
        .filter((sub) => sub.status === "submitted" || sub.status === "graded")
        .map((sub) => {
          const a = assessmentsMap.get(sub.assessment_id)
          return {
            id: sub.id,
            title: a?.title || "",
            subjectName: a?.subjects?.name || "",
            status: sub.status,
            total_score: sub.total_score,
            max_score: sub.max_score,
          }
        })
    )

    setIsLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem("student")
    router.push("/talaba/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">{student?.full_name}</p>
              <p className="text-xs text-muted-foreground">O&apos;quvchi paneli</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Chiqish
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-primary" />
            Mavjud testlar
          </h2>
          <div className="space-y-3">
            {availableTests.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Hozircha topshirish uchun test yo&apos;q
                </CardContent>
              </Card>
            )}
            {availableTests.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-muted-foreground">{t.subjectName}</p>
                  </div>
                  <Button onClick={() => router.push(`/test/${t.join_code}`)}>
                    {t.submissionStatus === "in_progress" ? "Davom ettirish" : "Boshlash"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
            Mening natijalarim
          </h2>
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">Hali natijalar yo&apos;q</p>
              ) : (
                <div className="divide-y divide-border">
                  {results.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{r.title}</p>
                        <p className="text-sm text-muted-foreground">{r.subjectName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            r.status === "graded" ? "bg-chart-2/10 text-chart-2" : "bg-chart-3/10 text-chart-3"
                          }
                        >
                          {r.status === "graded" ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {r.status === "graded" ? "Baholandi" : "Kutilmoqda"}
                        </Badge>
                        <span className="font-semibold w-16 text-right">
                          {r.total_score !== null ? `${r.total_score} / ${r.max_score}` : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
