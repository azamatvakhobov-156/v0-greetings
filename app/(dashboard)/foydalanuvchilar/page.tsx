"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
  GraduationCap
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  username: string
  password_hash: string
  full_name: string
  role: "admin" | "director" | "teacher"
  phone: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  director: "Direktor",
  teacher: "O'qituvchi"
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-4 w-4" />,
  director: <UserCog className="h-4 w-4" />,
  teacher: <GraduationCap className="h-4 w-4" />
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "teacher" as "admin" | "director" | "teacher",
    phone: "",
    is_active: true
  })

  const supabase = createClient()

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
    fetchUsers()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (isEditing && selectedUser) {
        // Update user
        const updateData: Record<string, unknown> = {
          username: formData.username.toLowerCase().trim(),
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        }

        // Only update password if provided
        if (formData.password) {
          updateData.password_hash = formData.password
        }

        const { error } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", selectedUser.id)

        if (error) throw error
      } else {
        // Create new user
        const { error } = await supabase
          .from("users")
          .insert({
            username: formData.username.toLowerCase().trim(),
            password_hash: formData.password,
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone || null,
            is_active: formData.is_active
          })

        if (error) throw error
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

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: "",
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || "",
      is_active: user.is_active
    })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Rostdan ham bu foydalanuvchini o'chirmoqchimisiz?")) return

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
      is_active: true
    })
    setSelectedUser(null)
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
            Tizim foydalanuvchilarini boshqarish
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? "Foydalanuvchi ma'lumotlarini yangilang" 
                  : "Yangi foydalanuvchi qo'shing"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
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
                  <Label htmlFor="role">Lavozim</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: "admin" | "director" | "teacher") => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="director">Direktor</SelectItem>
                      <SelectItem value="teacher">O&apos;qituvchi</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {isEditing ? "Saqlash" : "Qo'shish"}
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
                Barcha tizim foydalanuvchilari
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
