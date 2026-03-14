"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { GraduationCap, Loader2, Eye, EyeOff, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!username || !password) {
      setError("Login va parolni kiriting")
      setIsLoading(false)
      return
    }

    try {
      // Foydalanuvchini tekshirish
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username.toLowerCase().trim())
        .single()

      if (userError || !user) {
        setError("Login yoki parol noto'g'ri")
        setIsLoading(false)
        return
      }

      // Parolni tekshirish
      if (user.password_hash !== password) {
        setError("Login yoki parol noto'g'ri")
        setIsLoading(false)
        return
      }

      // Aktiv emasligini tekshirish
      if (!user.is_active) {
        setError("Sizning akkauntingiz faol emas. Admin bilan bog'laning.")
        setIsLoading(false)
        return
      }

      // Last login ni yangilash
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", user.id)

      // Session yaratish (localStorage)
      localStorage.setItem("user", JSON.stringify({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url
      }))

      // Dashboard ga yo'naltirish
      router.push("/")
      router.refresh()
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setIsLoading(false)
    }
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
            <CardTitle className="text-xl">Tizimga kirish</CardTitle>
            <CardDescription>
              Login va parolingizni kiriting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Login</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Loginni kiriting"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
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
                    autoComplete="current-password"
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

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kirish...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Kirish
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Parolni unutdingizmi? Admin bilan bog&apos;laning.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test login */}
        <div className="mt-4 p-4 rounded-lg bg-card border border-border">
          <p className="text-sm font-medium text-foreground mb-2">Test uchun:</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Login:</span> admin<br />
            <span className="font-medium">Parol:</span> admin123
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 156-maktab Boshqaruv Tizimi
        </p>
      </div>
    </div>
  )
}
