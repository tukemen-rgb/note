"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import type { Question } from "@/lib/firebase/types";

interface QuizQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  isBookmarked: boolean;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  onToggleBookmark: () => void;
}

export function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  isBookmarked,
  onAnswer,
  onToggleBookmark,
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { settings, getFontSizeClass, getButtonSizeClass } = useSettings();

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    const isCorrect = selectedAnswer === question.correctAnswer;
    onAnswer(selectedAnswer, isCorrect);
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            問{questionIndex + 1} / {totalQuestions}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {question.category}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleBookmark}
          className={cn(isBookmarked && "text-accent")}
        >
          {isBookmarked ? "保存済" : "保存"}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-secondary">
        <div
          className="h-1.5 rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-sm text-muted-foreground">
            {question.year}年度 第{question.questionNumber}問
          </p>
        </CardHeader>
        <CardContent>
          <p className={cn("whitespace-pre-wrap", getFontSizeClass(settings.questionSize))}>
            {question.questionText}
          </p>
        </CardContent>
      </Card>

      {/* Answer options */}
      <div className="space-y-2">
        {question.choices.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectAnswer = index === question.correctAnswer;

          let optionStyle = "border-border hover:border-accent/50 hover:bg-secondary/50";
          
          if (showResult) {
            if (isCorrectAnswer) {
              optionStyle = "border-success bg-success/10 text-foreground";
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle = "border-destructive bg-destructive/10 text-foreground";
            } else {
              optionStyle = "border-border opacity-50";
            }
          } else if (isSelected) {
            optionStyle = "border-accent bg-accent/10";
          }

          return (
            <button
              key={index}
              onClick={() => handleSelectAnswer(index)}
              disabled={showResult}
              className={cn(
                "w-full rounded-lg border-2 p-4 text-left transition-all",
                optionStyle
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  showResult && isCorrectAnswer
                    ? "bg-success text-success-foreground"
                    : showResult && isSelected && !isCorrectAnswer
                    ? "bg-destructive text-destructive-foreground"
                    : isSelected
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {index + 1}
                </span>
                <span className={cn("flex-1", getFontSizeClass(settings.choiceSize))}>
                  {option}
                </span>
                {showResult && isCorrectAnswer && (
                  <span className="shrink-0 text-success font-bold">正解</span>
                )}
                {showResult && isSelected && !isCorrectAnswer && (
                  <span className="shrink-0 text-destructive font-bold">不正解</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm button or explanation */}
      {!showResult ? (
        <Button
          onClick={handleConfirm}
          disabled={selectedAnswer === null}
          className={cn("w-full", getButtonSizeClass(settings.buttonSize))}
        >
          回答を確定
        </Button>
      ) : (
        <Card className={cn(
          "border-2",
          isCorrect ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <span className="font-semibold text-success">正解</span>
              ) : (
                <span className="font-semibold text-destructive">不正解</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn("text-muted-foreground", getFontSizeClass(settings.explanationSize))}>
              {question.explanation}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
