"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { GraduationCap, Loader2, Eye, EyeOff, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!fullName || !email || !password) {
      setError("Barcha maydonlarni to'ldiring")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Parollar mos kelmaydi")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Supabase Auth bilan ro'yxatdan o'tish
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: "teacher", // Default rol
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (authError) {
        if (authError.message.includes("User already registered")) {
          setError("Bu email allaqachon ro'yxatdan o'tgan")
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      if (data.user) {
        setSuccess(true)
      }
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-600">Muvaffaqiyatli!</CardTitle>
              <CardDescription>
                Emailingizga tasdiqlash xabari yuborildi. Iltimos, emailingizni tekshiring va havolani bosing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Kirish sahifasiga qaytish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">156-maktab</h1>
          <p className="text-muted-foreground text-sm mt-1">Boshqaruv tizimi</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Ro'yxatdan o'tish</CardTitle>
            <CardDescription>
              Yangi hisob yaratish
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">To'liq ism</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ismingizni kiriting"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@maktab.uz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Parolni kiriting"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 pr-10"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Parolni qayta kiriting"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ro'yxatdan o'tilmoqda...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ro'yxatdan o'tish
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                Hisobingiz bormi?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Kirish
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 156-maktab Boshqaruv Tizimi
        </p>
      </div>
    </div>
  )
}
