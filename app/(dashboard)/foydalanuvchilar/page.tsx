"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  UserCog,
  GraduationCap,
  Camera,
  Upload,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  username: string
  password_hash: string
  full_name: string
  role: "admin" | "director" | "deputy_director" | "teacher"
  phone: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
}

interface DepartmentOption {
  id: string
  name: string
}

interface SubjectOption {
  id: string
  name: string
}

interface LinkedStaff {
  id: string
  department_id: string | null
  subject_id: string | null
  position: string | null
  photo_url: string | null
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  director: "Direktor",
  deputy_director: "Direktor o'rinbosari",
  teacher: "O'qituvchi"
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-4 w-4" />,
  director: <UserCog className="h-4 w-4" />,
  deputy_director: <UserCog className="h-4 w-4" />,
  teacher: <GraduationCap className="h-4 w-4" />
}

function derivePosition(role: string, subjectName: string | null) {
  if (role === "teacher") return subjectName ? `${subjectName} fani o'qituvchisi` : "O'qituvchi"
  if (role === "admin") return "Administrator"
  if (role === "director") return "Direktor"
  if (role === "deputy_director") return "Direktor o'rinbosari"
  return "Xodim"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [linkedStaffId, setLinkedStaffId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null)

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "teacher" as "admin" | "director" | "deputy_director" | "teacher",
    phone: "",
    is_active: true,
    position: "",
    department_id: "",
    subject_id: "",
  })

  const supabase = createClient()

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
    fetchUsers()
    fetchDepartments()
    fetchSubjects()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setUsers(data)
    }
    setIsLoading(false)
  }

  const fetchDepartments = async () => {
    const { data } = await supabase.from("departments").select("id, name").order("name")
    setDepartments(data || [])
  }

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name").order("name")
    setSubjects(data || [])
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      let photo_url = existingPhotoUrl
      if (photoFile) {
        setIsUploadingPhoto(true)
        const uploadData = new FormData()
        uploadData.append("file", photoFile)
        uploadData.append("folder", "staff")
        try {
          const res = await fetch("/api/upload", { method: "POST", body: uploadData })
          const data = await res.json()
          if (res.ok) photo_url = data.url
        } catch {
          // fotosuratsiz ham saqlashda davom etamiz
        }
        setIsUploadingPhoto(false)
      }

      const subjectName = formData.subject_id
        ? subjects.find((s) => s.id === formData.subject_id)?.name || null
        : null
      const position = formData.position || derivePosition(formData.role, subjectName)
      const staff_type = formData.role === "teacher" ? "pedagogue" : "management"

      let userId = selectedUser?.id

      if (isEditing && selectedUser) {
        const updateData: Record<string, unknown> = {
          username: formData.username.toLowerCase().trim(),
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        }
        if (formData.password) {
          updateData.password_hash = formData.password
        }
        const { error } = await supabase.from("users").update(updateData).eq("id", selectedUser.id)
        if (error) throw error
      } else {
        const { data: newUser, error } = await supabase
          .from("users")
          .insert({
            username: formData.username.toLowerCase().trim(),
            password_hash: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone || null,
            is_active: formData.is_active
          })
          .select("id")
          .single()

        if (error) throw error
        userId = newUser.id
      }

      const staffData = {
        full_name: formData.full_name,
        position,
        department_id: formData.department_id || null,
        phone: formData.phone || null,
        staff_type,
        subject_id: formData.role === "teacher" ? formData.subject_id || null : null,
        photo_url,
        user_id: userId,
        status: formData.is_active ? "active" : "on_leave",
      }

      if (linkedStaffId) {
        await supabase.from("staff").update(staffData).eq("id", linkedStaffId)
      } else {
        await supabase.from("staff").insert(staffData)
      }

      await fetchUsers()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving user:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = async (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: "",
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || "",
      is_active: user.is_active,
      position: "",
      department_id: "",
      subject_id: "",
    })

    const { data: linkedStaff } = await supabase
      .from("staff")
      .select("id, department_id, subject_id, position, photo_url")
      .eq("user_id", user.id)
      .maybeSingle()

    if (linkedStaff) {
      const staff = linkedStaff as LinkedStaff
      setLinkedStaffId(staff.id)
      setExistingPhotoUrl(staff.photo_url)
      setFormData((prev) => ({
        ...prev,
        position: staff.position || "",
        department_id: staff.department_id || "",
        subject_id: staff.subject_id || "",
      }))
    } else {
      setLinkedStaffId(null)
      setExistingPhotoUrl(null)
    }

    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Rostdan ham bu foydalanuvchini o'chirmoqchimisiz? Bog'liq xodim yozuvi ham o'chiriladi.")) return

    await supabase.from("staff").delete().eq("user_id", userId)
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId)

    if (!error) {
      await fetchUsers()
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      role: "teacher",
      phone: "",
      is_active: true,
      position: "",
      department_id: "",
      subject_id: "",
    })
    setSelectedUser(null)
    setLinkedStaffId(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setIsEditing(false)
    setShowPassword(false)
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Check if current user is admin
  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Ruxsat yo&apos;q</h2>
            <p className="text-muted-foreground">
              Bu sahifaga faqat administratorlar kira oladi.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foydalanuvchilar</h1>
          <p className="text-muted-foreground">
            Xodimlarni va ularning tizimga kirish huquqini shu yerdan boshqaring
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yangi foydalanuvchi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi va xodim"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Foydalanuvchi va xodim ma'lumotlarini yangilang"
                  : "Bir martalik shakl orqali login, parol va xodim ma'lumotlari birga saqlanadi"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {(photoPreview || existingPhotoUrl) ? (
                      <AvatarImage src={photoPreview || existingPhotoUrl || ""} alt="Fotosurat" />
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <Camera className="h-6 w-6 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <input
                      id="staff-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("staff-photo")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Fotosurat tanlash
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      FaceID orqali davomat uchun ishlatiladi
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">To&apos;liq ism</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Familiya Ism"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Login</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="login"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Parol {isEditing && "(bo'sh qoldiring - o'zgarmaydi)"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={isEditing ? "Yangi parol" : "Parol"}
                      required={!isEditing}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "director" | "deputy_director" | "teacher") =>
                      setFormData({ ...formData, role: value, subject_id: value !== "teacher" ? "" : formData.subject_id })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="director">Direktor</SelectItem>
                      <SelectItem value="deputy_director">Direktor o&apos;rinbosari</SelectItem>
                      <SelectItem value="teacher">O&apos;qituvchi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === "teacher" && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Qaysi fan o&apos;qituvchisi</Label>
                    <Select
                      value={formData.subject_id}
                      onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Fanni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="department">Bo&apos;lim</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bo'limni tanlang (ixtiyoriy)" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Lavozim (ixtiyoriy)</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder={derivePosition(formData.role, subjects.find((s) => s.id === formData.subject_id)?.name || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal">
                    Faol foydalanuvchi
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploadingPhoto ? "Fotosurat yuklanmoqda..." : isEditing ? "Saqlash" : "Qo'shish"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jami foydalanuvchilar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faol</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nofaol</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => !u.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Foydalanuvchilar ro&apos;yxati</CardTitle>
              <CardDescription>
                Barcha tizim foydalanuvchilari va xodimlar
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Lavozim</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Oxirgi kirish</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Foydalanuvchilar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="font-mono text-sm">{user.username}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {roleIcons[user.role]}
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Faol" : "Nofaol"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString("uz-UZ")
                            : "Hech qachon"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
