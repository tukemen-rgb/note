"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { 
  getQuestionById, 
  isBookmarked, 
  addBookmark, 
  removeBookmark,
  saveLearningHistory 
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/firebase/types";

export default function BookmarkQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { settings, getFontSizeClass, getButtonSizeClass } = useSettings();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchQuestion() {
      if (user && questionId) {
        try {
          const q = await getQuestionById(decodeURIComponent(questionId));
          setQuestion(q);
          
          if (q) {
            const isMarked = await isBookmarked(user.uid, q.year, q.questionNumber);
            setBookmarked(isMarked);
          }
        } catch (error) {
          console.error("Failed to fetch question:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (user) {
      fetchQuestion();
    }
  }, [user, questionId]);

  const handleToggleBookmark = async () => {
    if (!user || !question) return;
    
    try {
      if (bookmarked) {
        await removeBookmark(user.uid, question.year, question.questionNumber);
        setBookmarked(false);
      } else {
        await addBookmark(user.uid, {
          questionId: question.id,
          year: question.year,
          questionNumber: question.questionNumber,
        });
        setBookmarked(true);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleConfirm = async () => {
    if (selectedAnswer === null || !user || !question) return;
    
    setShowResult(true);
    const isCorrect = selectedAnswer === question.correctAnswer;
    
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

  const handleRetry = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (!user || !question) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground mb-4">問題が見つかりませんでした</p>
        <Button onClick={() => router.push("/bookmarks")}>
          保存した問題一覧に戻る
        </Button>
      </main>
    );
  }

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/bookmarks")}>
            戻る
          </Button>
          <h1 className="font-bold">保存した問題</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleBookmark}
            className={cn(bookmarked && "text-accent")}
          >
            {bookmarked ? "保存済" : "保存"}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-24 pb-6 space-y-4">
        {/* Question info */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {question.year}年度 第{question.questionNumber}問
          </Badge>
          <Badge variant="outline" className="text-xs">
            {question.category}
          </Badge>
        </div>

        {/* Question card */}
        <Card>
          <CardContent className="pt-6">
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
          <>
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
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex-1"
              >
                もう一度
              </Button>
              <Button
                onClick={() => router.push("/bookmarks")}
                className="flex-1"
              >
                一覧に戻る
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
