"use client"

import { Progress } from "@/components/ui/progress"

interface QuizHeaderProps {
  currentQuestion: number
  totalQuestions: number
  correctCount: number
}

export function QuizHeader({ currentQuestion, totalQuestions, correctCount }: QuizHeaderProps) {
  const progress = ((currentQuestion) / totalQuestions) * 100

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">貸金業務取扱主任者</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-success font-medium">{correctCount}</span>
          <span>/</span>
          <span>{currentQuestion}</span>
          <span>問正解</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">進捗</span>
          <span className="font-medium">{currentQuestion} / {totalQuestions}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </header>
  )
}
