"use client"

import { useState } from "react"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Calendar,
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { staff } from "@/lib/mock-data"

const departments = [
  "Barchasi",
  "Rahbariyat",
  "O'quv",
  "Ma'naviyat",
  "Kadrlar",
  "Xo'jalik",
]

export default function KadrlarPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("Barchasi")

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment =
      selectedDepartment === "Barchasi" || s.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const departmentStats = departments.slice(1).map((dept) => ({
    name: dept,
    count: staff.filter((s) => s.department === dept).length,
  }))

  return (
    <>
      <Header
        title="Kadrlar bo'limi"
        description="Xodimlar ma'lumotlari va boshqaruvi"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Statistika */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jami xodimlar</p>
                  <p className="text-2xl font-bold text-foreground">
                    {staff.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          {departmentStats.slice(0, 4).map((dept, index) => (
            <Card key={dept.name} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{dept.name}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {dept.count}
                    </p>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      index === 0
                        ? "bg-chart-2/10"
                        : index === 1
                        ? "bg-chart-3/10"
                        : index === 2
                        ? "bg-chart-5/10"
                        : "bg-chart-4/10"
                    }`}
                  >
                    <Briefcase
                      className={`h-5 w-5 ${
                        index === 0
                          ? "text-chart-2"
                          : index === 1
                          ? "text-chart-3"
                          : index === 2
                          ? "text-chart-5"
                          : "text-chart-4"
                      }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtr va qidirish */}
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ism yoki lavozim bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bo'lim tanlang" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Yangi xodim
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Yangi xodim qo&apos;shish</DialogTitle>
                <DialogDescription>
                  Yangi xodim ma&apos;lumotlarini kiriting
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">To&apos;liq ism</label>
                  <Input placeholder="Familiya Ism Otasining ismi" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Lavozim</label>
                    <Input placeholder="Lavozim" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Bo&apos;lim</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.slice(1).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Telefon</label>
                    <Input placeholder="+998 90 123 45 67" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input placeholder="email@example.com" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Ishga kirgan sana</label>
                  <Input type="date" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Bekor qilish</Button>
                <Button>Saqlash</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Xodimlar jadvali */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Xodimlar ro&apos;yxati ({filteredStaff.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Xodim</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Bo&apos;lim</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-center">Ish staji</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {member.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {member.fullName}
                          </p>
                          {member.subject && (
                            <p className="text-xs text-muted-foreground">
                              {member.subject}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.position}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{member.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="text-sm">{member.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          (member.experience || 0) >= 10
                            ? "border-chart-2 text-chart-2"
                            : ""
                        }
                      >
                        {member.experience || 0} yil
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
                          <DropdownMenuItem>Profil</DropdownMenuItem>
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
      </main>
    </>
  )
}
