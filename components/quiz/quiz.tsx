"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { QuizHeader } from "./quiz-header"
import { QuestionCard } from "./question-card"
import { AnswerOptions } from "./answer-options"
import { ExplanationCard } from "./explanation-card"
import { QuizResult } from "./quiz-result"
import { questions as allQuestions } from "@/lib/questions"
import { ArrowRight, Play } from "lucide-react"

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function Quiz() {
  const [gameState, setGameState] = useState<"start" | "playing" | "finished">("start")
  const [questions, setQuestions] = useState(allQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const startQuiz = useCallback(() => {
    setQuestions(shuffleArray(allQuestions))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setCorrectCount(0)
    setGameState("playing")
  }, [])

  const handleSelectAnswer = useCallback((index: number) => {
    setSelectedAnswer(index)
  }, [])

  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null) return
    
    setIsAnswered(true)
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setCorrectCount((prev) => prev + 1)
    }
  }, [selectedAnswer, currentQuestion])

  const handleNextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setGameState("finished")
    } else {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    }
  }, [isLastQuestion])

  if (gameState === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">貸金業務取扱主任者</h1>
          <p className="text-muted-foreground">資格試験対策 問題演習</p>
        </div>
        <div className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>全{allQuestions.length}問の問題に挑戦しましょう</p>
          <p>合格ラインは70%以上です</p>
        </div>
        <Button onClick={startQuiz} size="lg" className="gap-2">
          <Play className="w-4 h-4" />
          スタート
        </Button>
      </div>
    )
  }

  if (gameState === "finished") {
    return (
      <QuizResult
        correctCount={correctCount}
        totalQuestions={questions.length}
        onRestart={startQuiz}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <QuizHeader
        currentQuestion={currentIndex + 1}
        totalQuestions={questions.length}
        correctCount={correctCount}
      />

      <QuestionCard question={currentQuestion} questionNumber={currentIndex + 1} />

      <AnswerOptions
        options={currentQuestion.options}
        selectedAnswer={selectedAnswer}
        correctAnswer={currentQuestion.correctAnswer}
        isAnswered={isAnswered}
        onSelect={handleSelectAnswer}
      />

      {isAnswered && (
        <ExplanationCard
          explanation={currentQuestion.explanation}
          isCorrect={selectedAnswer === currentQuestion.correctAnswer}
        />
      )}

      <div className="flex justify-end pt-2">
        {!isAnswered ? (
          <Button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            size="lg"
          >
            回答する
          </Button>
        ) : (
          <Button onClick={handleNextQuestion} size="lg" className="gap-2">
            {isLastQuestion ? "結果を見る" : "次の問題"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
