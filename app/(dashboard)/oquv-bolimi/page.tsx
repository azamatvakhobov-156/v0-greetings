"use client"

import { useState } from "react"
import {
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { classes, subjects, students } from "@/lib/mock-data"

export default function OquvBolimiPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSubjects = subjects.filter((subj) =>
    subj.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalStudents = classes.reduce((acc, cls) => acc + cls.studentsCount, 0)
  const averageGrade =
    classes.reduce((acc, cls) => acc + cls.averageGrade, 0) / classes.length

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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yangi qo&apos;shish
          </Button>
        </div>

        {/* Tablar */}
        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="classes">Sinflar</TabsTrigger>
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
                      <TableHead>Sinf rahbari</TableHead>
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
                        <TableCell>{cls.teacherName}</TableCell>
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
                      <TableHead>O&apos;qituvchi</TableHead>
                      <TableHead className="text-center">Haftalik soat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map((subj) => (
                      <TableRow key={subj.id} className="border-border">
                        <TableCell className="font-medium">
                          {subj.name}
                        </TableCell>
                        <TableCell>{subj.teacherName}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {subj.hoursPerWeek} soat
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
      </main>
    </>
  )
}
