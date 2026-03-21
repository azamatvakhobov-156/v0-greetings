"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import {
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  User,
  Filter,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  X,
  Play,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type TaskPriority = "low" | "medium" | "high" | "urgent"
type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled"

interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string
  assigned_by: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  staff?: {
    id: string
    full_name: string
    position: string
  }
  assigner?: {
    full_name: string
  }
}

interface TaskComment {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  profile?: {
    full_name: string
  }
}

interface StaffMember {
  id: string
  full_name: string
  position: string
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Past", className: "bg-muted text-muted-foreground" },
  medium: { label: "O'rta", className: "bg-primary/10 text-primary" },
  high: { label: "Yuqori", className: "bg-chart-3/10 text-chart-3" },
  urgent: { label: "Shoshilinch", className: "bg-destructive/10 text-destructive" },
}

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle; className: string }> = {
  pending: { label: "Kutilmoqda", icon: Circle, className: "text-muted-foreground" },
  in_progress: { label: "Bajarilmoqda", icon: Play, className: "text-primary" },
  completed: { label: "Bajarildi", icon: CheckCircle2, className: "text-chart-2" },
  cancelled: { label: "Bekor qilindi", icon: X, className: "text-destructive" },
}

export default function TopshiriqlarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all")
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canCreateTask, setCanCreateTask] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Yangi topshiriq formasi
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as TaskPriority,
    due_date: "",
  })

  const supabase = createClient()

  // Foydalanuvchi huquqlarini tekshirish
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const userData = JSON.parse(userStr)
      setCurrentUserId(userData.id)
      const canCreate = [
        "admin",
        "director",
        "deputy_academic",
        "deputy_education",
        "head_hr",
        "head_academic",
        "head_spiritual",
      ].includes(userData.role)
      setCanCreateTask(canCreate)
    }
  }, [])

  // Xodimlar ro'yxatini olish
  const fetchStaff = useCallback(async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("id, full_name, position")
      .order("full_name")

    if (data && !error) {
      setStaffList(data)
    }
  }, [supabase])

  // Topshiriqlarni olish
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        staff:assigned_to(id, full_name, position),
        assigner:assigned_by(full_name)
      `)
      .order("created_at", { ascending: false })

    if (data && !error) {
      setTasks(data)
    }

    setIsLoading(false)
  }, [supabase])

  // Izohlarni olish
  const fetchComments = useCallback(async (taskId: string) => {
    const { data, error } = await supabase
      .from("task_comments")
      .select(`
        *,
        profile:user_id(full_name)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })

    if (data && !error) {
      setComments(data)
    }
  }, [supabase])

  // Yangi topshiriq yaratish
  const createTask = async () => {
    if (!newTask.title || !newTask.assigned_to || !currentUserId) return

    setIsSubmitting(true)

    const { error } = await supabase.from("tasks").insert({
      title: newTask.title,
      description: newTask.description || null,
      assigned_to: newTask.assigned_to,
      assigned_by: currentUserId,
      priority: newTask.priority,
      due_date: newTask.due_date || null,
    })

    if (!error) {
      setNewTaskOpen(false)
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        due_date: "",
      })
      await fetchTasks()
    }

    setIsSubmitting(false)
  }

  // Topshiriq holatini yangilash
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "completed") {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)

    if (!error) {
      await fetchTasks()
      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) => prev ? { ...prev, status, ...updates } as Task : null)
      }
    }
  }

  // Izoh qo'shish
  const addComment = async () => {
    if (!newComment.trim() || !selectedTask || !currentUserId) return

    setIsSubmitting(true)

    const { error } = await supabase.from("task_comments").insert({
      task_id: selectedTask.id,
      user_id: currentUserId,
      comment: newComment.trim(),
    })

    if (!error) {
      setNewComment("")
      await fetchComments(selectedTask.id)
    }

    setIsSubmitting(false)
  }

  useEffect(() => {
    fetchStaff()
    fetchTasks()
  }, [fetchStaff, fetchTasks])

  useEffect(() => {
    if (selectedTask) {
      fetchComments(selectedTask.id)
    }
  }, [selectedTask, fetchComments])

  // Filtrlangan topshiriqlar
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false
    if (filterPriority !== "all" && task.priority !== filterPriority) return false
    return true
  })

  // Statistika
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed"
    ).length,
  }

  return (
    <>
      <Header
        title="Topshiriqlar"
        description="Xodimlarga topshiriqlar berish va nazorat qilish"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Statistika */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jami</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Circle className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kutilmoqda</p>
                  <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bajarilmoqda</p>
                  <p className="text-2xl font-bold text-primary">{stats.inProgress}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bajarildi</p>
                  <p className="text-2xl font-bold text-chart-2">{stats.completed}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
                  <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtrlar va tugmalar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as TaskStatus | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {(Object.keys(statusConfig) as TaskStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterPriority}
              onValueChange={(v) => setFilterPriority(v as TaskPriority | "all")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Muhimlik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha muhimlik</SelectItem>
                {(Object.keys(priorityConfig) as TaskPriority[]).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priorityConfig[priority].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canCreateTask && (
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Yangi topshiriq
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Yangi topshiriq yaratish</DialogTitle>
                  <DialogDescription>
                    Xodimga yangi topshiriq bering
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Sarlavha</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      placeholder="Topshiriq sarlavhasi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Tavsif</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                      placeholder="Batafsil tavsif..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mas'ul xodim</Label>
                    <Select
                      value={newTask.assigned_to}
                      onValueChange={(v) =>
                        setNewTask({ ...newTask, assigned_to: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Xodimni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.full_name} - {staff.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Muhimlik</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(v) =>
                          setNewTask({ ...newTask, priority: v as TaskPriority })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(priorityConfig) as TaskPriority[]).map(
                            (priority) => (
                              <SelectItem key={priority} value={priority}>
                                {priorityConfig[priority].label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Muddat</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) =>
                          setNewTask({ ...newTask, due_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setNewTaskOpen(false)}
                  >
                    Bekor qilish
                  </Button>
                  <Button
                    onClick={createTask}
                    disabled={!newTask.title || !newTask.assigned_to || isSubmitting}
                  >
                    {isSubmitting ? "Yaratilmoqda..." : "Yaratish"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Topshiriqlar ro'yxati */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Ro'yxat</TabsTrigger>
            <TabsTrigger value="board">Doska</TabsTrigger>
          </TabsList>

          {/* Ro'yxat ko'rinishi */}
          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Yuklanmoqda...
                </CardContent>
              </Card>
            ) : filteredTasks.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Topshiriqlar topilmadi
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const StatusIcon = statusConfig[task.status].icon
                  const isOverdue =
                    task.due_date &&
                    new Date(task.due_date) < new Date() &&
                    task.status !== "completed"

                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "bg-card border-border cursor-pointer hover:border-primary/50 transition-colors",
                        isOverdue && "border-destructive/50"
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <StatusIcon
                              className={cn(
                                "h-5 w-5 mt-0.5",
                                statusConfig[task.status].className
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{task.title}</h3>
                              {task.description && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge
                                  variant="outline"
                                  className="gap-1 font-normal"
                                >
                                  <User className="h-3 w-3" />
                                  {task.staff?.full_name}
                                </Badge>
                                {task.due_date && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "gap-1 font-normal",
                                      isOverdue && "border-destructive text-destructive"
                                    )}
                                  >
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(task.due_date), "d MMM", {
                                      locale: uz,
                                    })}
                                  </Badge>
                                )}
                                <Badge className={priorityConfig[task.priority].className}>
                                  {priorityConfig[task.priority].label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {task.status !== "in_progress" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateTaskStatus(task.id, "in_progress")
                                  }}
                                >
                                  Bajarishni boshlash
                                </DropdownMenuItem>
                              )}
                              {task.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateTaskStatus(task.id, "completed")
                                  }}
                                >
                                  Bajarildi deb belgilash
                                </DropdownMenuItem>
                              )}
                              {task.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateTaskStatus(task.id, "cancelled")
                                  }}
                                  className="text-destructive"
                                >
                                  Bekor qilish
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Doska ko'rinishi */}
          <TabsContent value="board">
            <div className="grid gap-4 md:grid-cols-4">
              {(["pending", "in_progress", "completed", "cancelled"] as TaskStatus[]).map(
                (status) => {
                  const config = statusConfig[status]
                  const StatusIcon = config.icon
                  const columnTasks = filteredTasks.filter((t) => t.status === status)

                  return (
                    <div key={status} className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <StatusIcon className={cn("h-4 w-4", config.className)} />
                        <span className="font-medium">{config.label}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {columnTasks.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {columnTasks.map((task) => (
                          <Card
                            key={task.id}
                            className="bg-card border-border cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => setSelectedTask(task)}
                          >
                            <CardContent className="p-3">
                              <h4 className="font-medium text-sm truncate">
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    priorityConfig[task.priority].className
                                  )}
                                >
                                  {priorityConfig[task.priority].label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 truncate">
                                {task.staff?.full_name}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Topshiriq detallari Sheet */}
        <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <SheetContent className="sm:max-w-[500px] overflow-y-auto">
            {selectedTask && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedTask.title}</SheetTitle>
                  <SheetDescription>
                    {selectedTask.assigner?.full_name} tomonidan yaratilgan
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                  {/* Holat va muhimlik */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusConfig[selectedTask.status].className}>
                      {statusConfig[selectedTask.status].label}
                    </Badge>
                    <Badge className={priorityConfig[selectedTask.priority].className}>
                      {priorityConfig[selectedTask.priority].label}
                    </Badge>
                  </div>

                  {/* Tavsif */}
                  {selectedTask.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tavsif</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTask.description}
                      </p>
                    </div>
                  )}

                  {/* Ma'lumotlar */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Mas'ul:</span>
                      <span>
                        {selectedTask.staff?.full_name} - {selectedTask.staff?.position}
                      </span>
                    </div>
                    {selectedTask.due_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Muddat:</span>
                        <span>
                          {format(new Date(selectedTask.due_date), "d MMMM yyyy", {
                            locale: uz,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Yaratilgan:</span>
                      <span>
                        {format(new Date(selectedTask.created_at), "d MMMM yyyy, HH:mm", {
                          locale: uz,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Holatni o'zgartirish */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Holatni o'zgartirish</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
                        if (status === selectedTask.status) return null
                        return (
                          <Button
                            key={status}
                            variant="outline"
                            size="sm"
                            onClick={() => updateTaskStatus(selectedTask.id, status)}
                          >
                            {statusConfig[status].label}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Izohlar */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Izohlar ({comments.length})
                    </h4>
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-muted/50 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">
                              {comment.profile?.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), "d MMM, HH:mm", {
                                locale: uz,
                              })}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Izoh yozing..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            addComment()
                          }
                        }}
                      />
                      <Button onClick={addComment} disabled={!newComment.trim() || isSubmitting}>
                        Yuborish
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </main>
    </>
  )
}
