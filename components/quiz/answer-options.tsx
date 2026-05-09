"use client"

import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface AnswerOptionsProps {
  options: string[]
  selectedAnswer: number | null
  correctAnswer: number
  isAnswered: boolean
  onSelect: (index: number) => void
}

export function AnswerOptions({
  options,
  selectedAnswer,
  correctAnswer,
  isAnswered,
  onSelect,
}: AnswerOptionsProps) {
  const labels = ["A", "B", "C", "D"]

  return (
    <div className="flex flex-col gap-3">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === index
        const isCorrect = index === correctAnswer
        const showCorrect = isAnswered && isCorrect
        const showIncorrect = isAnswered && isSelected && !isCorrect

        return (
          <button
            key={index}
            onClick={() => !isAnswered && onSelect(index)}
            disabled={isAnswered}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
              "hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !isAnswered && "cursor-pointer",
              isAnswered && "cursor-default",
              !isAnswered && isSelected && "border-primary bg-secondary",
              showCorrect && "border-success bg-success/10",
              showIncorrect && "border-destructive bg-destructive/10"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0",
                !isAnswered && !isSelected && "bg-secondary text-secondary-foreground",
                !isAnswered && isSelected && "bg-primary text-primary-foreground",
                showCorrect && "bg-success text-success-foreground",
                showIncorrect && "bg-destructive text-destructive-foreground"
              )}
            >
              {showCorrect ? (
                <Check className="w-4 h-4" />
              ) : showIncorrect ? (
                <X className="w-4 h-4" />
              ) : (
                labels[index]
              )}
            </span>
            <span className="text-sm leading-relaxed pt-1">{option}</span>
          </button>
        )
      })}
    </div>
  )
}
