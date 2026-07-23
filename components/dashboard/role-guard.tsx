"use client"

import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const [role, setRole] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setRole(user.role)
    }
    setChecked(true)
  }, [])

  if (!checked) return null

  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Ruxsat yo&apos;q</h2>
            <p className="text-muted-foreground">
              Bu sahifaga kirish huquqingiz yo&apos;q.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
