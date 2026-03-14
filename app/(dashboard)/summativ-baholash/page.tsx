"use client"

import { useState } from "react"
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
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  AlertTriangle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { classes, students, subjects, subjectPerformanceData } from "@/lib/mock-data"

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

export default function SummativBaholashPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState("1")
  const [selectedQuarter, setSelectedQuarter] = useState("1")

  const classStudents = students.filter((s) => s.classId === selectedClass)
  const filteredStudents = classStudents.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedClassName =
    classes.find((c) => c.id === selectedClass)?.name || ""

  // Calculate statistics
  const avgGrade =
    classStudents.reduce((acc, s) => acc + s.averageGrade, 0) /
    (classStudents.length || 1)
  const excellentCount = classStudents.filter((s) => s.averageGrade >= 4.5).length
  const goodCount = classStudents.filter(
    (s) => s.averageGrade >= 3.5 && s.averageGrade < 4.5
  ).length
  const riskCount = classStudents.filter((s) => s.riskLevel === "high").length

  return (
    <>
      <Header
        title="Summativ baholash"
        description="Choraklik baholar va o'zlashtirish tahlili"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Filtrlar */}
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sinf tanlang" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} sinf
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

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Eksport
          </Button>
        </div>

        {/* Statistika */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">O&apos;rtacha ball</p>
                  <p className="text-2xl font-bold text-foreground">
                    {avgGrade.toFixed(1)}
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
                  <p className="text-sm text-muted-foreground">A&apos;lochilar</p>
                  <p className="text-2xl font-bold text-chart-2">
                    {excellentCount}
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
                  <p className="text-sm text-muted-foreground">Yaxshi o&apos;quvchilar</p>
                  <p className="text-2xl font-bold text-chart-3">
                    {goodCount}
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
                  <p className="text-sm text-muted-foreground">Xavf guruhida</p>
                  <p className="text-2xl font-bold text-destructive">
                    {riskCount}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tablar */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">O&apos;quvchilar</TabsTrigger>
            <TabsTrigger value="subjects">Fanlar bo&apos;yicha</TabsTrigger>
            <TabsTrigger value="analytics">Tahlil</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedClassName} sinfi - {quarters.find((q) => q.value === selectedQuarter)?.label} natijalari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>O&apos;quvchi</TableHead>
                      <TableHead className="text-center">O&apos;rtacha ball</TableHead>
                      <TableHead className="text-center">Davomat</TableHead>
                      <TableHead className="text-center">Holat</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student.id} className="border-border">
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.fullName}
                        </TableCell>
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
                          </Badge>
                        </TableCell>
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
                          </Badge>
                        </TableCell>
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
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {student.averageGrade >= 4.0 ? (
                            <TrendingUp className="h-4 w-4 text-chart-2 mx-auto" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Batafsil</DropdownMenuItem>
                              <DropdownMenuItem>Baholar tarixi</DropdownMenuItem>
                              <DropdownMenuItem>Hisobot</DropdownMenuItem>
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
                <CardTitle className="text-base">
                  Fanlar bo&apos;yicha o&apos;zlashtirish
                </CardTitle>
              </CardHeader>
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
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Choraklar bo&apos;yicha dinamika</CardTitle>
                </CardHeader>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Choraklar bo&apos;yicha taqqoslash grafigi
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
                    Sinflar o&apos;rtasidagi taqqoslash
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
