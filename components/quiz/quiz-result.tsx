"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw, Target } from "lucide-react"

interface QuizResultProps {
  correctCount: number
  totalQuestions: number
  onRestart: () => void
}

export function QuizResult({ correctCount, totalQuestions, onRestart }: QuizResultProps) {
  const percentage = Math.round((correctCount / totalQuestions) * 100)
  const isPassing = percentage >= 70

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex flex-col items-center gap-4">
        <div className={`p-4 rounded-full ${isPassing ? "bg-success/20" : "bg-muted"}`}>
          {isPassing ? (
            <Trophy className="w-12 h-12 text-success" />
          ) : (
            <Target className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-center">
          {isPassing ? "合格ライン達成！" : "もう少し頑張りましょう"}
        </h2>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-5xl font-bold">
            <span className={isPassing ? "text-success" : "text-foreground"}>{percentage}</span>
            <span className="text-2xl text-muted-foreground">%</span>
          </CardTitle>
          <CardDescription className="text-base">
            {totalQuestions}問中 {correctCount}問正解
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>正解数</span>
              <span className="font-medium text-success">{correctCount}問</span>
            </div>
            <div className="flex justify-between">
              <span>不正解数</span>
              <span className="font-medium text-destructive">{totalQuestions - correctCount}問</span>
            </div>
            <div className="flex justify-between">
              <span>正答率</span>
              <span className="font-medium text-foreground">{percentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onRestart} size="lg" className="gap-2">
        <RotateCcw className="w-4 h-4" />
        もう一度挑戦する
      </Button>
    </div>
  )
}
