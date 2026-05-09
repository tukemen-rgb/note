"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { getIncorrectQuestions } from "@/lib/firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Question } from "@/lib/firebase/types";

interface IncorrectQuestion {
  question: Question;
  incorrectCount: number;
  lastIncorrectAt: Date;
}

export default function ReviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [incorrectQuestions, setIncorrectQuestions] = useState<IncorrectQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchIncorrectQuestions() {
      if (user) {
        try {
          const questions = await getIncorrectQuestions(user.uid);
          setIncorrectQuestions(questions);
        } catch (error) {
          console.error("Failed to fetch incorrect questions:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (user) {
      fetchIncorrectQuestions();
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            戻る
          </Button>
          <h1 className="font-bold text-lg">間違えた問題</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {incorrectQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">間違えた問題はありません</p>
              <p className="text-sm text-muted-foreground mt-2">
                問題を解くと、間違えた問題がここに表示されます
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {incorrectQuestions.length}問の間違えた問題があります
            </p>
            {incorrectQuestions.map(({ question, incorrectCount }) => (
              <Card
                key={question.id}
                className="cursor-pointer transition-all hover:bg-secondary/50 hover:border-accent/50"
                onClick={() => router.push(`/review/${question.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        {question.year}年
                      </span>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        問{question.questionNumber}
                      </span>
                      <span className="text-xs text-destructive">
                        {incorrectCount}回不正解
                      </span>
                    </div>
                    <p className="text-sm truncate text-muted-foreground">
                      {question.questionText.split("\n")[0]}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
