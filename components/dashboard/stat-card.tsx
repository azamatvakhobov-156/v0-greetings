import {
  Users,
  CalendarCheck,
  GraduationCap,
  Briefcase,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { StatCardData } from "@/lib/types"

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  "calendar-check": CalendarCheck,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
}

interface StatCardProps {
  data: StatCardData
}

export function StatCard({ data }: StatCardProps) {
  const Icon = iconMap[data.icon] || Users

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {data.title}
            </span>
            <span className="text-3xl font-bold text-foreground tabular-nums">
              {data.value}
            </span>
            {data.change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {data.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                ) : data.trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : null}
                <span
                  className={`text-xs font-medium ${
                    data.trend === "up"
                      ? "text-chart-2"
                      : data.trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {data.change > 0 ? "+" : ""}
                  {data.change}
                </span>
                <span className="text-xs text-muted-foreground">
                  {data.changeLabel}
                </span>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
