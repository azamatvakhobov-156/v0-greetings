"use client"

import { useState } from "react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import {
  Calendar,
  Award,
  AlertTriangle,
  Plus,
  Search,
  MoreHorizontal,
  PartyPopper,
  Users,
  Trophy,
  Flag,
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
import { events, disciplineRecords } from "@/lib/mock-data"

const eventTypeConfig = {
  academic: { label: "Ta'lim", icon: Trophy, color: "bg-primary/10 text-primary" },
  cultural: { label: "Madaniy", icon: PartyPopper, color: "bg-chart-2/10 text-chart-2" },
  sports: { label: "Sport", icon: Flag, color: "bg-chart-3/10 text-chart-3" },
  meeting: { label: "Yig'ilish", icon: Users, color: "bg-chart-5/10 text-chart-5" },
  holiday: { label: "Bayram", icon: Calendar, color: "bg-destructive/10 text-destructive" },
}

const disciplineTypeConfig = {
  warning: { label: "Ogohlantirish", icon: AlertTriangle, color: "bg-chart-3/10 text-chart-3" },
  reward: { label: "Mukofot", icon: Award, color: "bg-chart-2/10 text-chart-2" },
  penalty: { label: "Jazo", icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
}

export default function ManaviyatPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const filteredRecords = disciplineRecords.filter((record) =>
    record.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Header
        title="Ma'naviyat bo'limi"
        description="Tadbirlar, intizom va tarbiyaviy ishlar"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Statistika */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kelgusi tadbirlar</p>
                  <p className="text-2xl font-bold text-foreground">
                    {upcomingEvents.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mukofotlar</p>
                  <p className="text-2xl font-bold text-chart-2">
                    {disciplineRecords.filter((r) => r.type === "reward").length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ogohlantirishlar</p>
                  <p className="text-2xl font-bold text-chart-3">
                    {disciplineRecords.filter((r) => r.type === "warning").length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jazolar</p>
                  <p className="text-2xl font-bold text-destructive">
                    {disciplineRecords.filter((r) => r.type === "penalty").length}
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
        <Tabs defaultValue="events" className="space-y-4">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <TabsList>
              <TabsTrigger value="events">Tadbirlar</TabsTrigger>
              <TabsTrigger value="discipline">Intizom</TabsTrigger>
              <TabsTrigger value="reports">Hisobotlar</TabsTrigger>
            </TabsList>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi qo&apos;shish
            </Button>
          </div>

          <TabsContent value="events">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const config = eventTypeConfig[event.type]
                const EventIcon = config.icon
                return (
                  <Card key={event.id} className="bg-card border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}
                          >
                            <EventIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {event.title}
                            </CardTitle>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Tahrirlash</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              O&apos;chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {format(new Date(event.date), "d MMMM yyyy", {
                            locale: uz,
                          })}
                        </span>
                        {event.time && (
                          <span className="text-muted-foreground">
                            | {event.time}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="discipline">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Intizom yozuvlari</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="O'quvchi qidirish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>O&apos;quvchi</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead>Sababi</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Kim tomonidan</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const config = disciplineTypeConfig[record.type]
                      const TypeIcon = config.icon
                      return (
                        <TableRow key={record.id} className="border-border">
                          <TableCell className="font-medium">
                            {record.studentName}
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              <TypeIcon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {record.reason}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.date), "d MMM yyyy", {
                              locale: uz,
                            })}
                          </TableCell>
                          <TableCell>{record.issuedBy}</TableCell>
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
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Hisobotlar
                </h3>
                <p className="text-muted-foreground mb-4">
                  Ma&apos;naviy-ma&apos;rifiy ishlar bo&apos;yicha hisobotlarni yaratish
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Hisobot yaratish
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
