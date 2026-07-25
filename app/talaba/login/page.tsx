"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function StudentLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
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
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, full_name, class_id, username, password_hash")
        .eq("username", username.toLowerCase().trim())
        .single()

      if (studentError || !student) {
        setError("Login yoki parol noto'g'ri")
        setIsLoading(false)
        return
      }

      if (student.password_hash !== password) {
        setError("Login yoki parol noto'g'ri")
        setIsLoading(false)
        return
      }

      localStorage.setItem(
        "student",
        JSON.stringify({
          id: student.id,
          full_name: student.full_name,
          class_id: student.class_id,
          username: student.username,
        })
      )
      router.push("/talaba")
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src="/school-logo.png" alt="156-maktab" className="h-16 w-16 rounded-2xl object-contain" />
          <div className="text-center">
            <h1 className="text-2xl font-bold">156-maktab</h1>
            <p className="text-muted-foreground text-sm">O&apos;quvchilar paneli</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tizimga kirish</CardTitle>
            <CardDescription>Login va parolingizni kiriting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Login</Label>
                <Input
                  id="username"
                  placeholder="Loginni kiriting"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Parolni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Kirish
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Login/parolni bilmasangiz, sinf rahbaringizga murojaat qiling.
        </p>
      </div>
    </div>
  )
}
