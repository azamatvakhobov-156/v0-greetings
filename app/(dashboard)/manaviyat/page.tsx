"use client"

import { useState, useEffect } from "react"
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
  Loader2,
  Download,
  Upload,
  X,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type EventType = "meeting" | "competition" | "ceremony" | "training" | "other"
type IncidentType = "warning" | "violation" | "achievement" | "note"

interface EventRow {
  id: string
  title: string
  description: string | null
  event_type: EventType
  start_date: string
  location: string | null
  created_by: string | null
  organizerName: string | null
  photos: string[]
}

interface DisciplineRow {
  id: string
  student_id: string
  incident_type: IncidentType
  description: string
  incident_date: string
  studentName: string
}

interface StudentOption {
  id: string
  full_name: string
}

const eventTypeConfig: Record<EventType, { label: string; icon: typeof Trophy; color: string }> = {
  competition: { label: "Musobaqa", icon: Trophy, color: "bg-primary/10 text-primary" },
  ceremony: { label: "Marosim", icon: PartyPopper, color: "bg-chart-2/10 text-chart-2" },
  training: { label: "Trening", icon: Flag, color: "bg-chart-3/10 text-chart-3" },
  meeting: { label: "Yig'ilish", icon: Users, color: "bg-chart-5/10 text-chart-5" },
  other: { label: "Boshqa", icon: Calendar, color: "bg-muted text-muted-foreground" },
}

const disciplineTypeConfig: Record<IncidentType, { label: string; icon: typeof AlertTriangle; color: string }> = {
  warning: { label: "Ogohlantirish", icon: AlertTriangle, color: "bg-chart-3/10 text-chart-3" },
  achievement: { label: "Yutuq", icon: Award, color: "bg-chart-2/10 text-chart-2" },
  violation: { label: "Qoidabuzarlik", icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
  note: { label: "Eslatma", icon: AlertTriangle, color: "bg-muted text-muted-foreground" },
}

export default function ManaviyatPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [events, setEvents] = useState<EventRow[]>([])
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRow[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])

  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_type: "meeting" as EventType,
    start_date: "",
    location: "",
  })
  const [eventPhotoFiles, setEventPhotoFiles] = useState<File[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; full_name: string } | null>(null)

  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false)
  const [disciplineForm, setDisciplineForm] = useState({
    student_id: "",
    incident_type: "note" as IncidentType,
    description: "",
    incident_date: format(new Date(), "yyyy-MM-dd"),
  })

  const supabase = createClient()

  const fetchData = async () => {
    setIsLoading(true)
    const [eventsRes, disciplineRes, studentsRes] = await Promise.all([
      supabase
        .from("events")
        .select("id, title, description, event_type, start_date, location, created_by, users(full_name)")
        .order("start_date", { ascending: false }),
      supabase
        .from("discipline_records")
        .select("id, student_id, incident_type, description, incident_date, students(full_name)")
        .order("incident_date", { ascending: false }),
      supabase.from("students").select("id, full_name").order("full_name"),
    ])

    const rawEvents = (eventsRes.data || []) as unknown as Array<{
      id: string
      title: string
      description: string | null
      event_type: EventType
      start_date: string
      location: string | null
      created_by: string | null
      users: { full_name: string } | null
    }>

    const eventIds = rawEvents.map((e) => e.id)
    let photosByEvent: Record<string, string[]> = {}
    if (eventIds.length > 0) {
      const { data: photosData } = await supabase
        .from("event_photos")
        .select("event_id, photo_url")
        .in("event_id", eventIds)
      ;(photosData || []).forEach((p) => {
        if (!photosByEvent[p.event_id]) photosByEvent[p.event_id] = []
        photosByEvent[p.event_id].push(p.photo_url)
      })
    }

    setEvents(
      rawEvents.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        event_type: e.event_type,
        start_date: e.start_date,
        location: e.location,
        created_by: e.created_by,
        organizerName: e.users?.full_name || null,
        photos: photosByEvent[e.id] || [],
      }))
    )
    setStudents(studentsRes.data || [])

    const records = (disciplineRes.data || []) as unknown as Array<{
      id: string
      student_id: string
      incident_type: IncidentType
      description: string
      incident_date: string
      students: { full_name: string } | null
    }>
    setDisciplineRecords(
      records.map((r) => ({
        id: r.id,
        student_id: r.student_id,
        incident_type: r.incident_type,
        description: r.description,
        incident_date: r.incident_date,
        studentName: r.students?.full_name || "Noma'lum",
      }))
    )
    setIsLoading(false)
  }

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) setCurrentUser(JSON.parse(userStr))
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.start_date) return
    setIsSaving(true)

    const { data: newEvent, error } = await supabase
      .from("events")
      .insert({
        title: eventForm.title,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        start_date: new Date(eventForm.start_date).toISOString(),
        location: eventForm.location || null,
        created_by: currentUser?.id || null,
      })
      .select("id")
      .single()

    if (error || !newEvent) {
      setIsSaving(false)
      return
    }

    if (eventPhotoFiles.length > 0) {
      setIsUploadingPhotos(true)
      for (const file of eventPhotoFiles) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "events")
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData })
          const data = await res.json()
          if (res.ok) {
            await supabase.from("event_photos").insert({ event_id: newEvent.id, photo_url: data.url })
          }
        } catch {
          // bitta fotosurat yuklanmasa ham davom etamiz
        }
      }
      setIsUploadingPhotos(false)
    }

    setIsSaving(false)
    setIsEventModalOpen(false)
    setEventForm({ title: "", description: "", event_type: "meeting", start_date: "", location: "" })
    setEventPhotoFiles([])
    fetchData()
  }

  const handleDeleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id)
    fetchData()
  }

  const canSeeAllReports = currentUser && ["admin", "director", "deputy_director"].includes(currentUser.role)

  const reportEvents = canSeeAllReports
    ? events
    : events.filter((e) => e.created_by === currentUser?.id)

  const handleDownloadReport = () => {
    const title = canSeeAllReports
      ? "Barcha o'tkazilgan tadbirlar hisoboti"
      : `${currentUser?.full_name || ""} tomonidan o'tkazilgan tadbirlar hisoboti`

    const rows = reportEvents
      .map((e) => {
        const photosHtml = e.photos
          .map((url) => `<img src="${url}" style="width:200px;margin:4px;border-radius:8px;" />`)
          .join("")
        return `
          <div style="margin-bottom:24px;padding:16px;border:1px solid #ddd;border-radius:8px;">
            <h3 style="margin:0 0 8px;">${e.title}</h3>
            <p style="color:#555;margin:0 0 4px;">Sana: ${format(new Date(e.start_date), "d MMMM yyyy", { locale: uz })}</p>
            <p style="color:#555;margin:0 0 4px;">Turi: ${eventTypeConfig[e.event_type].label}</p>
            ${e.location ? `<p style="color:#555;margin:0 0 4px;">Joyi: ${e.location}</p>` : ""}
            ${canSeeAllReports ? `<p style="color:#555;margin:0 0 4px;">Tashkilotchi: ${e.organizerName || "Noma'lum"}</p>` : ""}
            <p style="margin:8px 0;">${e.description || ""}</p>
            <div style="display:flex;flex-wrap:wrap;">${photosHtml}</div>
          </div>
        `
      })
      .join("")

    const html = `
      <!DOCTYPE html>
      <html lang="uz">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
      </head>
      <body style="font-family:sans-serif;max-width:800px;margin:40px auto;">
        <h1>${title}</h1>
        <p style="color:#777;">Yaratilgan sana: ${format(new Date(), "d MMMM yyyy", { locale: uz })}</p>
        <p style="color:#777;">Jami tadbirlar soni: ${reportEvents.length}</p>
        <hr style="margin:24px 0;" />
        ${rows || "<p>Tadbirlar topilmadi</p>"}
      </body>
      </html>
    `

    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `manaviyat-hisobot-${format(new Date(), "yyyy-MM-dd")}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveDiscipline = async () => {
    if (!disciplineForm.student_id || !disciplineForm.description) return
    setIsSaving(true)
    await supabase.from("discipline_records").insert({
      student_id: disciplineForm.student_id,
      incident_type: disciplineForm.incident_type,
      description: disciplineForm.description,
      incident_date: disciplineForm.incident_date,
    })
    setIsSaving(false)
    setIsDisciplineModalOpen(false)
    setDisciplineForm({
      student_id: "",
      incident_type: "note",
      description: "",
      incident_date: format(new Date(), "yyyy-MM-dd"),
    })
    fetchData()
  }

  const handleDeleteDiscipline = async (id: string) => {
    await supabase.from("discipline_records").delete().eq("id", id)
    fetchData()
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.start_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  const filteredRecords = disciplineRecords.filter((record) =>
    record.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                    {disciplineRecords.filter((r) => r.incident_type === "achievement").length}
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
                    {disciplineRecords.filter((r) => r.incident_type === "warning").length}
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
                    {disciplineRecords.filter((r) => r.incident_type === "violation").length}
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
            <div className="flex gap-2">
              <Button onClick={() => setIsDisciplineModalOpen(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Intizom yozuvi
              </Button>
              <Button onClick={() => setIsEventModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Yangi tadbir
              </Button>
            </div>
          </div>

          <TabsContent value="events">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  Hozircha tadbirlar yo&apos;q
                </p>
              )}
              {events.map((event) => {
                const config = eventTypeConfig[event.event_type]
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
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
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
                          {format(new Date(event.start_date), "d MMMM yyyy", {
                            locale: uz,
                          })}
                        </span>
                        {event.location && (
                          <span className="text-muted-foreground">
                            | {event.location}
                          </span>
                        )}
                      </div>
                      {event.organizerName && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Tashkilotchi: {event.organizerName}
                        </p>
                      )}
                      {event.photos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {event.photos.slice(0, 4).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={event.title}
                              className="h-14 w-14 object-cover rounded-md border border-border"
                            />
                          ))}
                          {event.photos.length > 4 && (
                            <div className="h-14 w-14 rounded-md border border-border flex items-center justify-center text-xs text-muted-foreground">
                              +{event.photos.length - 4}
                            </div>
                          )}
                        </div>
                      )}
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
                      <TableHead>Tavsif</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Yozuvlar topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredRecords.map((record) => {
                      const config = disciplineTypeConfig[record.incident_type]
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
                            {record.description}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.incident_date), "d MMM yyyy", {
                              locale: uz,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteDiscipline(record.id)}
                                >
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {canSeeAllReports
                        ? "Barcha o'tkazilgan tadbirlar hisoboti"
                        : "Mening tadbirlarim hisoboti"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {canSeeAllReports
                        ? "Barcha xodimlar tomonidan o'tkazilgan tadbirlar"
                        : "Siz tomonidan kiritilgan tadbirlar ro'yxati"}
                    </p>
                  </div>
                  <Button onClick={handleDownloadReport} disabled={reportEvents.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Hisobotni yuklab olish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reportEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {canSeeAllReports ? "Hali tadbirlar kiritilmagan" : "Siz hali tadbir kiritmagansiz"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportEvents.map((event) => {
                      const config = eventTypeConfig[event.event_type]
                      return (
                        <div key={event.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.start_date), "d MMMM yyyy", { locale: uz })} · {config.label}
                                {canSeeAllReports && event.organizerName && ` · ${event.organizerName}`}
                              </p>
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          )}
                          {event.photos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {event.photos.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt={event.title}
                                  className="h-20 w-20 object-cover rounded-md border border-border"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi tadbir qo&apos;shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nomi</Label>
                <Input
                  value={eventForm.title}
                  onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turi</Label>
                  <Select
                    value={eventForm.event_type}
                    onValueChange={(v) => setEventForm((p) => ({ ...p, event_type: v as EventType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sana</Label>
                  <Input
                    type="date"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm((p) => ({ ...p, start_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Joyi</Label>
                <Input
                  value={eventForm.location}
                  onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tadbirdan fotolavhalar</Label>
                <input
                  id="event-photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setEventPhotoFiles(Array.from(e.target.files || []))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("event-photos")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Fotosurat tanlash
                </Button>
                {eventPhotoFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eventPhotoFiles.map((file, i) => (
                      <div key={i} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-16 w-16 object-cover rounded-md border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => setEventPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={() => handleSaveEvent()} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUploadingPhotos ? "Fotosuratlar yuklanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDisciplineModalOpen} onOpenChange={setIsDisciplineModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Intizom yozuvi qo&apos;shish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>O&apos;quvchi</Label>
                <Select
                  value={disciplineForm.student_id}
                  onValueChange={(v) => setDisciplineForm((p) => ({ ...p, student_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="O'quvchini tanlang" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turi</Label>
                  <Select
                    value={disciplineForm.incident_type}
                    onValueChange={(v) =>
                      setDisciplineForm((p) => ({ ...p, incident_type: v as IncidentType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(disciplineTypeConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sana</Label>
                  <Input
                    type="date"
                    value={disciplineForm.incident_date}
                    onChange={(e) => setDisciplineForm((p) => ({ ...p, incident_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Textarea
                  value={disciplineForm.description}
                  onChange={(e) => setDisciplineForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDisciplineModalOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleSaveDiscipline} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Saqlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  )
}
