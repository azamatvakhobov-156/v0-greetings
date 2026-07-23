"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,

  BookOpen,
  Heart,
  Users,
  FileText,
  Settings,
  LogOut,
  GraduationCap,
  UserCog,
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

interface UserData {
  id: string
  username: string
  full_name: string
  role: "admin" | "director" | "teacher"
  phone?: string
  avatar_url?: string
}

const mainNavItems = [
  {
    title: "Bosh sahifa",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Davomat",
    url: "/davomat",
    icon: CalendarCheck,
  },

  {
    title: "O'quv bo'limi",
    url: "/oquv-bolimi",
    icon: BookOpen,
  },
  {
    title: "Ma'naviyat bo'limi",
    url: "/manaviyat",
    icon: Heart,
  },
  {
    title: "Kadrlar bo'limi",
    url: "/kadrlar",
    icon: Users,
    roles: ["admin", "director"],
  },
  {
    title: "Summativ baholash",
    url: "/summativ-baholash",
    icon: FileText,
  },
]

const settingsNavItems = [
  {
    title: "Foydalanuvchilar",
    url: "/foydalanuvchilar",
    icon: UserCog,
    adminOnly: true,
  },
  {
    title: "Sozlamalar",
    url: "/sozlamalar",
    icon: Settings,
  },
]

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  director: "Direktor",
  teacher: "O'qituvchi"
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
  const filteredMainItems = mainNavItems.filter(item => {
    if (item.roles && user?.role && !item.roles.includes(user.role)) return false
    return true
  })

  const filteredSettingsItems = settingsNavItems.filter(item => {
    if (item.adminOnly && user?.role !== "admin") return false
    return true
  })

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
