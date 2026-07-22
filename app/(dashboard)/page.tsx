"use client"

import { useState, useEffect } from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Brain, Loader2 } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { AIInsightCard } from "@/components/dashboard/ai-insight-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { createClient } from "@/lib/supabase/client"
import type { StatCardData, AIInsight } from "@/lib/types"

const chartConfig = {
  present: {
    label: "Keldi",
    color: "var(--chart-2)",
  },
  absent: {
    label: "Kelmadi",
    color: "var(--chart-4)",
  },
  average: {
    label: "O'rtacha ball",
    color: "var(--chart-1)",
  },
}

const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"]

interface WeeklyAttendancePoint {
  day: string
  present: number
  absent: number
}

interface ClassPerformancePoint {
  class: string
  average: number
}

interface RiskDistributionPoint {
  name: string
  value: number
  color: string
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<StatCardData[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState<WeeklyAttendancePoint[]>([])
  const [classPerformanceData, setClassPerformanceData] = useState<ClassPerformancePoint[]>([])
  const [riskDistribution, setRiskDistribution] = useState<RiskDistributionPoint[]>([])

  const supabase = createClient()

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true)

      const [
        studentsRes,
        staffRes,
        classesRes,
        gradesRes,
        attendanceRes,
      ] = await Promise.all([
        supabase.from("students").select("id, class_id"),
        supabase.from("staff").select("id"),
        supabase.from("classes").select("id, name"),
        supabase.from("grades").select("student_id, score"),
        supabase
          .from("student_attendance")
          .select("student_id, date, status")
          .order("date", { ascending: false })
          .limit(500),
      ])

      const studentsList = studentsRes.data || []
      const staffList = staffRes.data || []
      const classesList = classesRes.data || []
      const grades = gradesRes.data || []
      const attendance = attendanceRes.data || []

      // --- Stat cards ---
      const today = new Date().toISOString().slice(0, 10)
      const todayAttendance = attendance.filter((a) => a.date === today)
      const todayPresent = todayAttendance.filter((a) => a.status === "present").length
      const todayRate =
        todayAttendance.length > 0
          ? Math.round((todayPresent / todayAttendance.length) * 100)
          : 0

      const overallAvg =
        grades.length > 0
          ? grades.reduce((acc, g) => acc + Number(g.score), 0) / grades.length / 20
          : 0

      setDashboardStats([
        {
          title: "Jami o'quvchilar",
          value: studentsList.length,
          icon: "users",
        },
        {
          title: "Bugungi davomat",
          value: `${todayRate}%`,
          icon: "calendar-check",
        },
        {
          title: "O'rtacha o'zlashtirish",
          value: overallAvg.toFixed(1),
          icon: "graduation-cap",
        },
        {
          title: "Xodimlar soni",
          value: staffList.length,
          icon: "briefcase",
        },
      ])

      // --- Weekly attendance (last 7 days present/absent) ---
      const byDate = new Map<string, { present: number; absent: number }>()
      attendance.forEach((a) => {
        const entry = byDate.get(a.date) || { present: 0, absent: 0 }
        if (a.status === "present") entry.present++
        else if (a.status === "absent") entry.absent++
        byDate.set(a.date, entry)
      })
      const sortedDates = Array.from(byDate.keys()).sort().slice(-7)
      setWeeklyAttendanceData(
        sortedDates.map((d) => {
          const dow = new Date(d).getDay() // 0=Sun
          const dayLabel = dayNames[(dow + 6) % 7]
          const entry = byDate.get(d)!
          return { day: dayLabel, present: entry.present, absent: entry.absent }
        })
      )

      // --- Class performance (average grade per class) ---
      const perf = classesList.map((cls) => {
        const classStudentIds = studentsList
          .filter((s) => s.class_id === cls.id)
          .map((s) => s.id)
        const classGrades = grades.filter((g) => classStudentIds.includes(g.student_id))
        const avg =
          classGrades.length > 0
            ? classGrades.reduce((acc, g) => acc + Number(g.score), 0) / classGrades.length / 20
            : 0
        return { class: cls.name, average: Number(avg.toFixed(1)) }
      })
      setClassPerformanceData(perf.filter((p) => p.average > 0))

      // --- Risk distribution ---
      let low = 0,
        medium = 0,
        high = 0
      studentsList.forEach((s) => {
        const studentGrades = grades.filter((g) => g.student_id === s.id)
        const avg5 =
          studentGrades.length > 0
            ? studentGrades.reduce((acc, g) => acc + Number(g.score), 0) / studentGrades.length / 20
            : 5
        const studentAttendance = attendance.filter((a) => a.student_id === s.id)
        const present = studentAttendance.filter((a) => a.status === "present").length
        const attRate =
          studentAttendance.length > 0 ? (present / studentAttendance.length) * 100 : 100

        if (avg5 < 3 || attRate < 80) high++
        else if (avg5 < 4 || attRate < 90) medium++
        else low++
      })
      setRiskDistribution([
        { name: "Past xavf", value: low, color: "var(--chart-2)" },
        { name: "O'rta xavf", value: medium, color: "var(--chart-3)" },
        { name: "Yuqori xavf", value: high, color: "var(--chart-4)" },
      ])

      // --- Data-driven insights (real numbers, not AI) ---
      const insights: AIInsight[] = []
      if (high > 0) {
        insights.push({
          id: "risk-high",
          type: "warning",
          title: "Yuqori xavf ostidagi o'quvchilar",
          description: `${high} nafar o'quvchi past o'zlashtirish yoki davomat sababli yuqori xavf guruhida. Ular bilan qo'shimcha ishlash tavsiya etiladi.`,
          priority: "high",
          category: "performance",
          createdAt: new Date().toISOString(),
        })
      }
      if (todayRate > 0 && todayRate < 90) {
        insights.push({
          id: "attendance-low",
          type: "warning",
          title: "Bugungi davomat past",
          description: `Bugungi davomat ko'rsatkichi ${todayRate}% ni tashkil etdi. O'rtacha ko'rsatkichdan pastroq.`,
          priority: "medium",
          category: "attendance",
          createdAt: new Date().toISOString(),
        })
      }
      const bestClass = [...perf].sort((a, b) => b.average - a.average)[0]
      if (bestClass && bestClass.average > 0) {
        insights.push({
          id: "best-class",
          type: "success",
          title: "Eng yuqori natijali sinf",
          description: `${bestClass.class} sinfi ${bestClass.average.toFixed(1)} ball bilan eng yuqori o'rtacha natijaga ega.`,
          priority: "low",
          category: "performance",
          createdAt: new Date().toISOString(),
        })
      }
      insights.push({
        id: "overview",
        type: "info",
        title: "Umumiy holat",
        description: `Hozirda tizimda ${studentsList.length} o'quvchi, ${staffList.length} xodim va ${classesList.length} sinf qayd etilgan.`,
        priority: "low",
        category: "recommendation",
        createdAt: new Date().toISOString(),
      })
      setAiInsights(insights)

      setIsLoading(false)
    }

    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        title="Bosh sahifa"
        description="Maktab boshqaruv tizimi - AI tahlillar"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Statistika kartalari */}
        <section>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map((stat, index) => (
              <StatCard key={index} data={stat} />
            ))}
          </div>
        </section>

        {/* AI Tahlillar */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              AI Tahlillar va Tavsiyalar
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiInsights.slice(0, 3).map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>

        {/* Grafiklar */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Haftalik davomat */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Haftalik davomat tendensiyasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyAttendanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="present"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={{ fill: "var(--chart-2)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="absent"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      dot={{ fill: "var(--chart-4)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Sinflar bo'yicha o'zlashtirish */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Sinflar bo&apos;yicha o&apos;zlashtirish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="class"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 5]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="average"
                      fill="var(--chart-1)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>

        {/* Xavf tahlili va tez statistika */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Xavf darajasi taqsimoti */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                O&apos;quvchilar xavf tahlili
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {riskDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Qo'shimcha AI tahlillar */}
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            {aiInsights.slice(3, 5).map((insight) => (
              <AIInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
