"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,
  MapPin,
  BookOpen,
  Heart,
  Users,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  UserCog,
  ClipboardList,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Yangi rollar
type UserRole = 
  | "admin" 
  | "director" 
  | "deputy_academic" 
  | "deputy_education"
  | "head_hr"
  | "head_academic"
  | "head_spiritual"
  | "teacher"
  | "accountant"
  | "librarian"
  | "technical"

interface UserData {
  id: string
  username: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
}

// Har bir menyu elementi uchun ruxsat etilgan rollar
interface NavItem {
  title: string
  url: string
  icon: typeof LayoutDashboard
  roles?: UserRole[] // Agar belgilanmasa, hammaga ko'rinadi
}

const mainNavItems: NavItem[] = [
  {
    title: "Bosh sahifa",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "GPS Davomat",
    url: "/gps-davomat",
    icon: MapPin,
  },
  {
    title: "Davomat",
    url: "/davomat",
    icon: CalendarCheck,
    roles: ["admin", "director", "deputy_academic", "deputy_education", "head_hr", "head_academic"],
  },
  {
    title: "Topshiriqlar",
    url: "/topshiriqlar",
    icon: ClipboardList,
  },
  {
    title: "O'quv bo'limi",
    url: "/oquv-bolimi",
    icon: BookOpen,
    roles: ["admin", "director", "deputy_academic", "head_academic", "teacher"],
  },
  {
    title: "Ma'naviyat bo'limi",
    url: "/manaviyat",
    icon: Heart,
    roles: ["admin", "director", "deputy_education", "head_spiritual", "teacher"],
  },
  {
    title: "Kadrlar bo'limi",
    url: "/kadrlar",
    icon: Users,
    roles: ["admin", "director", "head_hr"],
  },
  {
    title: "Summativ baholash",
    url: "/summativ-baholash",
    icon: FileText,
    roles: ["admin", "director", "deputy_academic", "head_academic", "teacher"],
  },
]

const settingsNavItems: NavItem[] = [
  {
    title: "Foydalanuvchilar",
    url: "/foydalanuvchilar",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    title: "Sozlamalar",
    url: "/sozlamalar",
    icon: Settings,
    roles: ["admin", "director"],
  },
]

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  director: "Direktor",
  deputy_academic: "O'quv ishlari bo'yicha direktor o'rinbosari",
  deputy_education: "Tarbiya ishlari bo'yicha direktor o'rinbosari",
  head_hr: "Kadrlar bo'limi boshlig'i",
  head_academic: "O'quv bo'limi boshlig'i",
  head_spiritual: "Ma'naviyat bo'limi boshlig'i",
  teacher: "O'qituvchi",
  accountant: "Buxgalter",
  librarian: "Kutubxonachi",
  technical: "Texnik xodim",
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  // Filter nav items based on user role
  const filterByRole = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.roles) return true // Agar roles belgilanmasa, hammaga ko'rinadi
      if (!user?.role) return false
      return item.roles.includes(user.role)
    })
  }

  const filteredMainItems = filterByRole(mainNavItems)
  const filteredSettingsItems = filterByRole(settingsNavItems)

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-sidebar-foreground">
              156-maktab
            </span>
            <span className="text-xs text-muted-foreground">
              Boshqaruv tizimi
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Asosiy
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tizim
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSettingsItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user?.full_name || "Foydalanuvchi"}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.role ? roleLabels[user.role] : ""}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
