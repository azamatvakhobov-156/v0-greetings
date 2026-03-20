"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
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
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ClipboardList,
  CheckCircle2,
  Clock,
  Paperclip,
  MessageSquare,
  Calendar,
  Upload,
  X,
  FileText,
  Image,
  File,
} from "lucide-react"

interface Staff {
  id: string
  full_name: string
  position: string
  department_id: string | null
  phone: string | null
  status: string
  hire_date: string | null
  staff_type: "technical" | "pedagogue" | "management"
  subject_id: string | null
  departments?: { name: string } | null
  subjects?: { name: string } | null
}

interface Subject {
  id: string
  name: string
}

const staffTypeLabels: Record<string, string> = {
  technical: "Texnik xodim",
  pedagogue: "Pedagog",
  management: "Rahbariyat"
}

interface Department {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  assigned_by: string | null
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  due_date: string | null
  completed_at: string | null
  created_at: string
  staff?: { full_name: string } | null
  users?: { full_name: string } | null
}

interface TaskAttachment {
  id: string
  task_id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

interface TaskComment {
  id: string
  task_id: string
  user_id: string | null
  comment: string
  created_at: string
  users?: { full_name: string } | null
}

interface UserData {
  id: string
  username: string
  full_name: string
  role: string
}

const priorityLabels: Record<string, string> = {
  low: "Past",
  medium: "O'rta",
  high: "Yuqori",
  urgent: "Shoshilinch"
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-yellow-500/20 text-yellow-400",
  urgent: "bg-red-500/20 text-red-400"
}

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  in_progress: "Bajarilmoqda",
  completed: "Bajarildi",
  cancelled: "Bekor qilindi"
}

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400"
}

export default function KadrlarPage() {
  const [activeTab, setActiveTab] = useState("xodimlar")
  const [staff, setStaff] = useState<Staff[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [taskStatusFilter, setTaskStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  
  // Staff modal states
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [staffForm, setStaffForm] = useState({
    full_name: "",
    position: "",
    department_id: "",
    phone: "",
    hire_date: "",
    staff_type: "technical" as "technical" | "pedagogue" | "management",
    subject_id: "",
  })
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Task modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as const,
    due_date: "",
  })
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingNewTask, setUploadingNewTask] = useState(false)

  // Task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([])
  const [taskComments, setTaskComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    await Promise.all([fetchStaff(), fetchDepartments(), fetchTasks(), fetchSubjects()])
    setIsLoading(false)
  }

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("staff")
      .select("*, departments(name), subjects(name)")
      .order("full_name")
    if (data) setStaff(data)
  }

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .order("name")
    if (data) setSubjects(data)
  }

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("name")
    if (data) setDepartments(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, staff(full_name), users(full_name)")
      .order("created_at", { ascending: false })
    if (data) setTasks(data)
  }

  const fetchTaskDetails = async (taskId: string) => {
    const [attachmentsRes, commentsRes] = await Promise.all([
      supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false }),
      supabase
        .from("task_comments")
        .select("*, users(full_name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
    ])
    
    if (attachmentsRes.data) setTaskAttachments(attachmentsRes.data)
    if (commentsRes.data) setTaskComments(commentsRes.data)
  }

  // Staff CRUD
  const handleSaveStaff = async () => {
    if (!staffForm.full_name || !staffForm.position) return

    const staffData = {
      full_name: staffForm.full_name,
      position: staffForm.position,
      department_id: staffForm.department_id || null,
      phone: staffForm.phone || null,
      hire_date: staffForm.hire_date || null,
      staff_type: staffForm.staff_type,
      subject_id: staffForm.staff_type === "pedagogue" ? (staffForm.subject_id || null) : null,
    }

    if (editingStaff) {
      await supabase
        .from("staff")
        .update(staffData)
        .eq("id", editingStaff.id)
    } else {
      await supabase.from("staff").insert(staffData)
    }

    setIsStaffModalOpen(false)
    setEditingStaff(null)
    setStaffForm({ full_name: "", position: "", department_id: "", phone: "", hire_date: "", staff_type: "technical", subject_id: "" })
    fetchStaff()
  }

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setStaffForm({
      full_name: staffMember.full_name,
      position: staffMember.position,
      department_id: staffMember.department_id || "",
      phone: staffMember.phone || "",
      hire_date: staffMember.hire_date || "",
      staff_type: staffMember.staff_type || "technical",
      subject_id: staffMember.subject_id || "",
    })
    setIsStaffModalOpen(true)
  }

  const handleDeleteStaff = async (id: string) => {
    await supabase.from("staff").delete().eq("id", id)
    fetchStaff()
  }

  // Task CRUD
  const handleSaveTask = async () => {
    if (!taskForm.title) return
    setUploadingNewTask(true)

    try {
      if (editingTask) {
        await supabase
          .from("tasks")
          .update({
            title: taskForm.title,
            description: taskForm.description || null,
            assigned_to: taskForm.assigned_to || null,
            priority: taskForm.priority,
            due_date: taskForm.due_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTask.id)
        
        // Upload pending files for edited task
        if (pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            const formData = new FormData()
            formData.append('file', file)
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })
            
            if (response.ok) {
              const data = await response.json()
              await supabase.from("task_attachments").insert({
                task_id: editingTask.id,
                file_name: data.fileName,
                file_url: data.url,
                file_type: data.fileType,
                file_size: data.fileSize,
                uploaded_by: currentUser?.id || null,
              })
            }
          }
        }
      } else {
        const { data: newTask } = await supabase.from("tasks").insert({
          title: taskForm.title,
          description: taskForm.description || null,
          assigned_to: taskForm.assigned_to || null,
          assigned_by: currentUser?.id || null,
          priority: taskForm.priority,
          due_date: taskForm.due_date || null,
        }).select().single()
        
        // Upload pending files for new task
        if (newTask && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            const formData = new FormData()
            formData.append('file', file)
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            })
            
            if (response.ok) {
              const data = await response.json()
              await supabase.from("task_attachments").insert({
                task_id: newTask.id,
                file_name: data.fileName,
                file_url: data.url,
                file_type: data.fileType,
                file_size: data.fileSize,
                uploaded_by: currentUser?.id || null,
              })
            }
          }
        }
      }

      setIsTaskModalOpen(false)
      setEditingTask(null)
      setTaskForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" })
      setPendingFiles([])
      fetchTasks()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setUploadingNewTask(false)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || "",
      assigned_to: task.assigned_to || "",
      priority: task.priority,
      due_date: task.due_date || "",
    })
    setPendingFiles([])
    setIsTaskModalOpen(true)
    setSelectedTask(null)
  }

  // Add files to pending list for new task
  const handleAddPendingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files)
    setPendingFiles([...pendingFiles, ...newFiles])
    e.target.value = ""
  }

  // Remove file from pending list
  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index))
  }

  const handleDeleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id)
    fetchTasks()
    setSelectedTask(null)
  }

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    await supabase
      .from("tasks")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
    fetchTasks()
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status: status as Task["status"] })
    }
  }

  const handleViewTask = async (task: Task) => {
    setSelectedTask(task)
    await fetchTaskDetails(task.id)
  }

  // Comments
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return

    await supabase.from("task_comments").insert({
      task_id: selectedTask.id,
      user_id: currentUser?.id || null,
      comment: newComment.trim(),
    })

    setNewComment("")
    fetchTaskDetails(selectedTask.id)
  }

  // File upload for existing task
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, taskId?: string) => {
    const targetTaskId = taskId || selectedTask?.id
    if (!e.target.files || !targetTaskId) return
    setIsUploading(true)

    const file = e.target.files[0]
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Upload error:', error)
        setIsUploading(false)
        return
      }
      
      const data = await response.json()
      
      await supabase.from("task_attachments").insert({
        task_id: targetTaskId,
        file_name: data.fileName,
        file_url: data.url,
        file_type: data.fileType,
        file_size: data.fileSize,
        uploaded_by: currentUser?.id || null,
      })

      if (selectedTask) {
        fetchTaskDetails(selectedTask.id)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
    
    setIsUploading(false)
    e.target.value = ""
  }

  const handleDeleteAttachment = async (id: string) => {
    await supabase.from("task_attachments").delete().eq("id", id)
    if (selectedTask) fetchTaskDetails(selectedTask.id)
  }

  // Filters
  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || s.department_id === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = taskStatusFilter === "all" || t.status === taskStatusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const totalTasks = tasks.length
  const pendingTasks = tasks.filter((t) => t.status === "pending").length
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length
  const completedTasks = tasks.filter((t) => t.status === "completed").length

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />
    if (fileType.includes("pdf") || fileType.includes("document")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kadrlar bo'limi</h1>
          <p className="text-muted-foreground">Xodimlar va topshiriqlarni boshqarish</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{staff.length}</p>
                <p className="text-sm text-muted-foreground">Jami xodimlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <ClipboardList className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Jami topshiriqlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingTasks + inProgressTasks}</p>
                <p className="text-sm text-muted-foreground">Faol topshiriqlar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
                <p className="text-sm text-muted-foreground">Bajarilgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="xodimlar">Xodimlar</TabsTrigger>
          <TabsTrigger value="topshiriqlar">Topshiriqlar</TabsTrigger>
        </TabsList>

        {/* Xodimlar Tab */}
        <TabsContent value="xodimlar" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg">Xodimlar ro'yxati</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Qidirish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full sm:w-[200px]"
                    />
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Bo'lim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha bo'limlar</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingStaff(null)
                        setStaffForm({ full_name: "", position: "", department_id: "", phone: "", hire_date: "", staff_type: "technical", subject_id: "" })
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Xodim qo'shish
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingStaff ? "Xodimni tahrirlash" : "Yangi xodim"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Xodim turi</Label>
                          <Select
                            value={staffForm.staff_type}
                            onValueChange={(value: "technical" | "pedagogue" | "management") => 
                              setStaffForm({ ...staffForm, staff_type: value, subject_id: value !== "pedagogue" ? "" : staffForm.subject_id })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technical">Texnik xodim</SelectItem>
                              <SelectItem value="pedagogue">Pedagog</SelectItem>
                              <SelectItem value="management">Rahbariyat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {staffForm.staff_type === "pedagogue" && (
                          <div className="space-y-2">
                            <Label>Fan</Label>
                            <Select
                              value={staffForm.subject_id}
                              onValueChange={(value) => setStaffForm({ ...staffForm, subject_id: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Fanni tanlang" />
                              </SelectTrigger>
                              <SelectContent>
                                {subjects.map((subj) => (
                                  <SelectItem key={subj.id} value={subj.id}>
                                    {subj.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>F.I.O.</Label>
                          <Input
                            value={staffForm.full_name}
                            onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                            placeholder="To'liq ism"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Lavozim</Label>
                          <Input
                            value={staffForm.position}
                            onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                            placeholder="Lavozim"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bo'lim</Label>
                          <Select
                            value={staffForm.department_id}
                            onValueChange={(value) => setStaffForm({ ...staffForm, department_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Bo'limni tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Telefon</Label>
                          <Input
                            value={staffForm.phone}
                            onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                            placeholder="+998 90 123 45 67"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ishga kirgan sana</Label>
                          <Input
                            type="date"
                            value={staffForm.hire_date}
                            onChange={(e) => setStaffForm({ ...staffForm, hire_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Bekor qilish</Button>
                        </DialogClose>
                        <Button onClick={handleSaveStaff}>Saqlash</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Xodim</TableHead>
                    <TableHead>Lavozim</TableHead>
                    <TableHead>Bo'lim</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/kadrlar/${s.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {s.full_name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium hover:underline">{s.full_name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>{s.position}</TableCell>
                      <TableCell>{s.departments?.name || "-"}</TableCell>
                      <TableCell>{s.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge className={s.status === "active" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>
                          {s.status === "active" ? "Faol" : "Nofaol"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/kadrlar/${s.id}`}>
                                <Users className="h-4 w-4 mr-2" />
                                Profilni ko'rish
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditStaff(s)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Tahrirlash
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteStaff(s.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              O'chirish
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaff.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Xodimlar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topshiriqlar Tab */}
        <TabsContent value="topshiriqlar" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg">Topshiriqlar</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Qidirish..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full sm:w-[200px]"
                    />
                  </div>
                  <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Holat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barcha holatlar</SelectItem>
                      <SelectItem value="pending">Kutilmoqda</SelectItem>
                      <SelectItem value="in_progress">Bajarilmoqda</SelectItem>
                      <SelectItem value="completed">Bajarildi</SelectItem>
                      <SelectItem value="cancelled">Bekor qilindi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={isTaskModalOpen} onOpenChange={(open) => {
                    setIsTaskModalOpen(open)
                    if (!open) {
                      setPendingFiles([])
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingTask(null)
                        setTaskForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" })
                        setPendingFiles([])
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Topshiriq berish
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          {editingTask ? "Topshiriqni tahrirlash" : "Yangi topshiriq"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Sarlavha</Label>
                          <Input
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                            placeholder="Topshiriq sarlavhasi"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tavsif</Label>
                          <Textarea
                            value={taskForm.description}
                            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                            placeholder="Batafsil tavsif..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mas'ul xodim</Label>
                          <Select
                            value={taskForm.assigned_to}
                            onValueChange={(value) => setTaskForm({ ...taskForm, assigned_to: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Xodimni tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.filter(s => s.status === "active").map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.full_name} - {s.position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Muhimlik</Label>
                            <Select
                              value={taskForm.priority}
                              onValueChange={(value: "low" | "medium" | "high" | "urgent") => 
                                setTaskForm({ ...taskForm, priority: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Past</SelectItem>
                                <SelectItem value="medium">O'rta</SelectItem>
                                <SelectItem value="high">Yuqori</SelectItem>
                                <SelectItem value="urgent">Shoshilinch</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Muddat</Label>
                            <Input
                              type="date"
                              value={taskForm.due_date}
                              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        {/* Fayl ilova qilish */}
                        <div className="space-y-2">
                          <Label>Ilovalar</Label>
                          <div className="border border-dashed border-border rounded-lg p-4">
                            <input
                              type="file"
                              id="task-file-input"
                              className="hidden"
                              onChange={handleAddPendingFile}
                              multiple
                            />
                            <label
                              htmlFor="task-file-input"
                              className="flex flex-col items-center justify-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Upload className="h-8 w-8" />
                              <span className="text-sm">Fayl yuklash uchun bosing</span>
                              <span className="text-xs">Maksimum 10MB</span>
                            </label>
                          </div>
                          
                          {/* Pending files list */}
                          {pendingFiles.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {pendingFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 rounded-md bg-secondary/50"
                                >
                                  <div className="flex items-center gap-2">
                                    {getFileIcon(file.type)}
                                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({formatFileSize(file.size)})
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleRemovePendingFile(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Bekor qilish</Button>
                        </DialogClose>
                        <Button onClick={handleSaveTask} disabled={uploadingNewTask}>
                          {uploadingNewTask ? (
                            <>
                              <span className="animate-spin mr-2">
                                <Upload className="h-4 w-4" />
                              </span>
                              Yuklanmoqda...
                            </>
                          ) : "Saqlash"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => handleViewTask(task)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        task.status === "completed" ? "bg-green-500/10" :
                        task.status === "in_progress" ? "bg-blue-500/10" :
                        "bg-muted"
                      }`}>
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : task.status === "in_progress" ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : (
                          <ClipboardList className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{task.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {task.staff && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {task.staff.full_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(task.due_date).toLocaleDateString("uz-UZ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[task.priority]}>
                        {priorityLabels[task.priority]}
                      </Badge>
                      <Badge className={statusColors[task.status]}>
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    Topshiriqlar topilmadi
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={priorityColors[selectedTask.priority]}>
                        {priorityLabels[selectedTask.priority]}
                      </Badge>
                      <Badge className={statusColors[selectedTask.status]}>
                        {statusLabels[selectedTask.status]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTask(selectedTask)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteTask(selectedTask.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {selectedTask.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Tavsif</h4>
                    <p className="text-foreground">{selectedTask.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Mas'ul</h4>
                    <p className="text-foreground">{selectedTask.staff?.full_name || "-"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Muddat</h4>
                    <p className="text-foreground">
                      {selectedTask.due_date
                        ? new Date(selectedTask.due_date).toLocaleDateString("uz-UZ")
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Holatni o'zgartirish</h4>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "in_progress", "completed", "cancelled"].map((status) => (
                      <Button
                        key={status}
                        variant={selectedTask.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateTaskStatus(selectedTask.id, status)}
                      >
                        {statusLabels[status]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Ilovalar ({taskAttachments.length})
                    </h4>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <Button variant="outline" size="sm" asChild disabled={isUploading}>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? "Yuklanmoqda..." : "Fayl qo'shish"}
                        </span>
                      </Button>
                    </label>
                  </div>
                  <div className="space-y-2">
                    {taskAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(attachment.file_type)}
                          <div>
                            <p className="text-sm font-medium">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {taskAttachments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Hozircha ilovalar yo'q
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Izohlar ({taskComments.length})
                  </h4>
                  <div className="space-y-3">
                    {taskComments.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {comment.users?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.users?.full_name || "Noma'lum"}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString("uz-UZ")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground ml-8">{comment.comment}</p>
                      </div>
                    ))}
                    {taskComments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Hozircha izohlar yo'q
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Izoh yozing..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      Yuborish
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
