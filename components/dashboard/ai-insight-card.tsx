import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AIInsight } from "@/lib/types"

interface AIInsightCardProps {
  insight: AIInsight
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-destructive/10",
    iconColor: "text-destructive",
    badgeVariant: "destructive" as const,
  },
  success: {
    icon: CheckCircle2,
    bgColor: "bg-chart-2/10",
    iconColor: "text-chart-2",
    badgeVariant: "default" as const,
  },
  info: {
    icon: Info,
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    badgeVariant: "secondary" as const,
  },
  action: {
    icon: Lightbulb,
    bgColor: "bg-chart-3/10",
    iconColor: "text-chart-3",
    badgeVariant: "outline" as const,
  },
}

const priorityLabels = {
  low: "Past",
  medium: "O'rta",
  high: "Yuqori",
}

const categoryLabels = {
  attendance: "Davomat",
  performance: "O'zlashtirish",
  behavior: "Xulq-atvor",
  recommendation: "Tavsiya",
}

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const config = typeConfig[insight.type]
  const Icon = config.icon

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}
            >
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                {insight.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {categoryLabels[insight.category]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Muhimlik: {priorityLabels[insight.priority]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {insight.description}
        </p>
        {(insight.relatedStudents || insight.relatedClasses) && (
          <div className="mt-3 flex items-center gap-2">
            {insight.relatedStudents && (
              <Badge variant="secondary" className="text-xs">
                {insight.relatedStudents.length} o&apos;quvchi
              </Badge>
            )}
            {insight.relatedClasses && (
              <Badge variant="secondary" className="text-xs">
                {insight.relatedClasses.length} sinf
              </Badge>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 -ml-2 text-primary hover:text-primary"
        >
          Batafsil ko&apos;rish
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
