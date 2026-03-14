"use client"

import { useState } from "react"
import {
  User,
  Lock,
  Bell,
  Palette,
  Database,
  Shield,
  Save,
} from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { currentUser } from "@/lib/mock-data"

export default function SozlamalarPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    weeklyReport: true,
  })

  return (
    <>
      <Header
        title="Sozlamalar"
        description="Tizim va profil sozlamalari"
      />

      <main className="flex-1 p-6 space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="security">Xavfsizlik</TabsTrigger>
            <TabsTrigger value="notifications">Bildirishnomalar</TabsTrigger>
            <TabsTrigger value="appearance">Ko&apos;rinish</TabsTrigger>
            <TabsTrigger value="system">Tizim</TabsTrigger>
          </TabsList>

          {/* Profil */}
          <TabsContent value="profile">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil ma&apos;lumotlari
                </CardTitle>
                <CardDescription>
                  Shaxsiy ma&apos;lumotlaringizni yangilang
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {currentUser.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Rasm yuklash
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG. Maksimum 2MB
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To&apos;liq ism</label>
                    <Input defaultValue={currentUser.fullName} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input defaultValue={currentUser.email} type="email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefon</label>
                    <Input defaultValue="+998 90 123 45 67" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lavozim</label>
                    <Input defaultValue="Direktor" disabled />
                  </div>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Saqlash
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Xavfsizlik */}
          <TabsContent value="security">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Xavfsizlik sozlamalari
                </CardTitle>
                <CardDescription>
                  Parol va kirish sozlamalarini boshqaring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Parolni o&apos;zgartirish</h3>
                  <div className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Joriy parol</label>
                      <Input type="password" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Yangi parol</label>
                      <Input type="password" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Parolni tasdiqlash</label>
                      <Input type="password" />
                    </div>
                  </div>
                  <Button>Parolni yangilash</Button>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Ikki bosqichli autentifikatsiya</h3>
                      <p className="text-sm text-muted-foreground">
                        Qo&apos;shimcha xavfsizlik qatlami
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bildirishnomalar */}
          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Bildirishnoma sozlamalari
                </CardTitle>
                <CardDescription>
                  Qanday bildirishnomalar olishni tanlang
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email bildirishnomalari</h3>
                      <p className="text-sm text-muted-foreground">
                        Muhim yangiliklar emailga yuboriladi
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, email: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push bildirishnomalari</h3>
                      <p className="text-sm text-muted-foreground">
                        Brauzerda bildirishnomalar
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, push: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">SMS bildirishnomalari</h3>
                      <p className="text-sm text-muted-foreground">
                        Telefonga SMS yuboriladi
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, sms: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Haftalik hisobot</h3>
                      <p className="text-sm text-muted-foreground">
                        Har hafta statistika hisoboti
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          weeklyReport: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Saqlash
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ko'rinish */}
          <TabsContent value="appearance">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Ko&apos;rinish sozlamalari
                </CardTitle>
                <CardDescription>
                  Interfeys ko&apos;rinishini sozlang
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mavzu</label>
                    <Select defaultValue="dark">
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Yorug&apos;</SelectItem>
                        <SelectItem value="dark">Qorong&apos;u</SelectItem>
                        <SelectItem value="system">Tizim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Til</label>
                    <Select defaultValue="uz">
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uz">O&apos;zbek</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Ixcham sidebar</h3>
                      <p className="text-sm text-muted-foreground">
                        Sidebar avtomatik yig&apos;iladi
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Saqlash
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tizim */}
          <TabsContent value="system">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Ma&apos;lumotlar bazasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Holat</span>
                    <span className="text-chart-2 font-medium">Faol</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Oxirgi zaxira</span>
                    <span>Bugun, 03:00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hajmi</span>
                    <span>245 MB</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Zaxira nusxa olish
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Tizim xavfsizligi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SSL sertifikati</span>
                    <span className="text-chart-2 font-medium">Faol</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Oxirgi yangilanish</span>
                    <span>3 kun oldin</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Versiya</span>
                    <span>1.0.0</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Yangilanishlarni tekshirish
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
