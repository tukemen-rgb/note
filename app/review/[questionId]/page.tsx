"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { useSettings } from "@/lib/settings-context";
import { getQuestionById, saveLearningHistory } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Question } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

export default function ReviewQuestionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;
  const { settings, getFontSizeClass, getButtonSizeClass } = useSettings();

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const q = await getQuestionById(questionId);
        setQuestion(q);
      } catch (error) {
        console.error("Failed to fetch question:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestion();
  }, [questionId]);

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = async () => {
    if (selectedAnswer === null || !question || !user) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    setIsAnswered(true);

    try {
      await saveLearningHistory(user.uid, {
        questionId: question.id,
        year: question.year,
        questionNumber: question.questionNumber,
        selectedAnswer,
        isCorrect,
      });
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  };

  if (loading || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (!user || !question) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">問題が見つかりません</p>
      </main>
    );
  }

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/review")}>
            戻る
          </Button>
          <div>
            <h1 className="font-bold text-lg">
              {question.year}年 問{question.questionNumber}
            </h1>
            <p className="text-xs text-muted-foreground">{question.category}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-24 pb-6 space-y-4">
        <Card>
          <CardContent className="p-4">
            <p className={cn("whitespace-pre-wrap", getFontSizeClass(settings.questionSize))}>
              {question.questionText}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {question.choices.map((choice, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            
            let buttonStyle = "border-border hover:border-accent/50 hover:bg-secondary/50";
            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStyle = "border-success bg-success/10";
              } else if (isSelected && !isCorrectAnswer) {
                buttonStyle = "border-destructive bg-destructive/10";
              }
            } else if (isSelected) {
              buttonStyle = "border-accent bg-accent/10";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  buttonStyle,
                  isAnswered && "cursor-default"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className={cn("flex-1", getFontSizeClass(settings.choiceSize))}>
                    {choice}
                  </span>
                  {isAnswered && isCorrectAnswer && (
                    <span className="text-success font-bold flex-shrink-0">正解</span>
                  )}
                  {isAnswered && isSelected && !isCorrectAnswer && (
                    <span className="text-destructive font-bold flex-shrink-0">不正解</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!isAnswered && (
          <Button
            className={cn("w-full", getButtonSizeClass(settings.buttonSize))}
            onClick={handleConfirm}
            disabled={selectedAnswer === null}
          >
            解答を確定
          </Button>
        )}

        {isAnswered && (
          <>
            <Card className={cn(
              "border-2",
              isCorrect ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <span className="font-bold text-success">正解</span>
                  ) : (
                    <span className="font-bold text-destructive">不正解</span>
                  )}
                </div>
                <p className={cn("text-muted-foreground whitespace-pre-wrap", getFontSizeClass(settings.explanationSize))}>
                  {question.explanation}
                </p>
              </CardContent>
            </Card>

            <Button
              className={cn("w-full", getButtonSizeClass(settings.buttonSize))}
              onClick={() => router.push("/review")}
            >
              問題一覧に戻る
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
