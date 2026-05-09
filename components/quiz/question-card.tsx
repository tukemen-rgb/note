"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Question } from "@/lib/questions"

interface QuestionCardProps {
  question: Question
  questionNumber: number
}

export function QuestionCard({ question, questionNumber }: QuestionCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-medium leading-relaxed">
            <span className="text-muted-foreground mr-2">Q{questionNumber}.</span>
            {question.question}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="w-fit mt-2">
          {question.category}
        </Badge>
      </CardHeader>
    </Card>
  )
}
