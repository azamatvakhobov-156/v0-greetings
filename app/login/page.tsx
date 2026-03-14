"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Eye, EyeOff, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<string>("teacher")

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message === "Invalid login credentials" 
          ? "Email yoki parol noto'g'ri" 
          : error.message)
        return
      }
      
      if (data.user) {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      setIsLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
            `${window.location.origin}/`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })
      
      if (error) {
        if (error.message.includes("already registered")) {
          setError("Bu email allaqachon ro'yxatdan o'tgan")
        } else {
          setError(error.message)
        }
        return
      }
      
      if (data.user) {
        if (data.user.identities?.length === 0) {
          setError("Bu email allaqachon ro'yxatdan o'tgan")
        } else if (data.session) {
          // Email tasdiqlanishi o'chirilgan - avtomatik kirish
          router.push("/")
          router.refresh()
        } else {
          // Email tasdiqlanishi yoqilgan
          setSuccess("Ro'yxatdan o'tdingiz! Emailingizni tasdiqlang yoki tizimga kiring.")
          setIsRegister(false)
          setPassword("")
        }
      }
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4">
            <GraduationCap className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">156-maktab</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI asosida maktab boshqaruv tizimi
          </p>
        </div>

        {/* Login/Register Card */}
        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isRegister ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
            </CardTitle>
            <CardDescription>
              {isRegister 
                ? "Yangi hisob yaratish uchun ma'lumotlaringizni kiriting"
                : "Hisobingizga kirish uchun ma'lumotlaringizni kiriting"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
              {isRegister && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      To&apos;liq ism
                    </label>
                    <Input
                      type="text"
                      placeholder="Familiya Ism"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-secondary border-0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Lavozim
                    </label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Lavozimni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="director">Direktor</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="teacher">O&apos;qituvchi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Parol
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-0 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isRegister && (
                  <p className="text-xs text-muted-foreground">
                    Kamida 6 ta belgi
                  </p>
                )}
              </div>

              {!isRegister && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border bg-secondary"
                    />
                    <span className="text-muted-foreground">Eslab qolish</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Parolni unutdingizmi?
                  </a>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isRegister ? "Ro'yxatdan o'tilmoqda..." : "Kirish..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isRegister ? (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Ro&apos;yxatdan o&apos;tish
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        Kirish
                      </>
                    )}
                  </span>
                )}
              </Button>
            </form>

            {/* Toggle between login/register */}
            <div className="mt-6 text-center text-sm">
              {isRegister ? (
                <p className="text-muted-foreground">
                  Hisobingiz bormi?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false)
                      setError(null)
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Tizimga kiring
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Hisobingiz yo&apos;qmi?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true)
                      setError(null)
                      setSuccess(null)
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Ro&apos;yxatdan o&apos;ting
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <div className="mt-4 p-4 rounded-lg bg-card border border-border">
          <p className="text-sm font-medium text-foreground mb-2">Test uchun:</p>
          <p className="text-xs text-muted-foreground">
            Yangi hisob yarating yoki mavjud hisob bilan kiring.
            Ro&apos;yxatdan o&apos;tgandan so&apos;ng emailingizni tasdiqlashingiz kerak bo&apos;lishi mumkin.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 156-maktab Boshqaruv Tizimi. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  )
}
