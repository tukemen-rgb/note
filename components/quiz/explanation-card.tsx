"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface ExplanationCardProps {
  explanation: string
  isCorrect: boolean
}

export function ExplanationCard({ explanation, isCorrect }: ExplanationCardProps) {
  return (
    <Card className={isCorrect ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-5 h-5 text-muted-foreground" />
          <span>{isCorrect ? "正解です！" : "不正解です"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
      </CardContent>
    </Card>
  )
}
