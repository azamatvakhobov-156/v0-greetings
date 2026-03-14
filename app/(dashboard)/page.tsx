"use client"

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
import { Brain } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { AIInsightCard } from "@/components/dashboard/ai-insight-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  dashboardStats,
  aiInsights,
  weeklyAttendanceData,
  classPerformanceData,
  students,
} from "@/lib/mock-data"

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

// Risk level distribution for pie chart
const riskDistribution = [
  {
    name: "Past xavf",
    value: students.filter((s) => s.riskLevel === "low").length,
    color: "var(--chart-2)",
  },
  {
    name: "O'rta xavf",
    value: students.filter((s) => s.riskLevel === "medium").length,
    color: "var(--chart-3)",
  },
  {
    name: "Yuqori xavf",
    value: students.filter((s) => s.riskLevel === "high").length,
    color: "var(--chart-4)",
  },
]

export default function DashboardPage() {
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
