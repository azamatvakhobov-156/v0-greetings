"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { classes, schedule, dayNames, periodTimes } from "@/lib/mock-data"

export default function DarsJadvaliPage() {
  const [selectedClass, setSelectedClass] = useState<string>("1")
  const [viewMode, setViewMode] = useState<"class" | "teacher">("class")

  const selectedClassName =
    classes.find((c) => c.id === selectedClass)?.name || ""

  // Filter schedule by class
  const classSchedule = schedule.filter((s) => s.classId === selectedClass)

  // Group by day
  const scheduleByDay = dayNames.map((day, dayIndex) => ({
    day,
    dayIndex: dayIndex + 1,
    lessons: classSchedule
      .filter((s) => s.day === dayIndex + 1)
      .sort((a, b) => a.period - b.period),
  }))

  return (
    <>
      <Header
        title="Dars jadvali"
        description="Sinflar va o'qituvchilar uchun haftalik jadval"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Filtrlar */}
        <div className="flex flex-wrap gap-4">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "class" | "teacher")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ko'rinish turi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="class">Sinf bo&apos;yicha</SelectItem>
              <SelectItem value="teacher">O&apos;qituvchi bo&apos;yicha</SelectItem>
            </SelectContent>
          </Select>

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
        </div>

        {/* Jadval */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedClassName} sinfi - Haftalik dars jadvali
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium text-muted-foreground w-24">
                      Vaqt
                    </th>
                    {dayNames.map((day) => (
                      <th
                        key={day}
                        className="p-3 text-center text-sm font-medium text-foreground"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodTimes.map((period) => (
                    <tr key={period.period} className="border-b border-border">
                      <td className="p-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {period.period}-dars
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {period.start} - {period.end}
                          </span>
                        </div>
                      </td>
                      {scheduleByDay.map(({ dayIndex, lessons }) => {
                        const lesson = lessons.find(
                          (l) => l.period === period.period
                        )
                        return (
                          <td key={dayIndex} className="p-2 text-center">
                            {lesson ? (
                              <div className="bg-secondary rounded-lg p-2 text-left">
                                <p className="font-medium text-sm text-foreground">
                                  {lesson.subjectName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {lesson.teacherName}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs"
                                >
                                  {lesson.room}-xona
                                </Badge>
                              </div>
                            ) : (
                              <div className="h-16 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dars vaqtlari */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">Dars vaqtlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {periodTimes.map((period) => (
                <div
                  key={period.period}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {period.period}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {period.period}-dars
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {period.start} - {period.end}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
