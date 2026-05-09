"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Home, RotateCcw, Trophy, Target, CheckCircle, XCircle } from "lucide-react";

interface ResultPageProps {
  year: number;
}

export function ResultPage({ year }: ResultPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const correct = parseInt(searchParams.get("correct") || "0", 10);
  const total = parseInt(searchParams.get("total") || "0", 10);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isPassed = accuracy >= 70;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-accent" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-center px-4 py-4">
          <h1 className="font-semibold">{year}年度 結果</h1>
        </div>
      </header>

      <div className="container max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Main Result Card */}
        <Card className={cn(
          "border-2 text-center",
          isPassed 
            ? "border-success/50 bg-gradient-to-b from-success/10 to-success/5" 
            : "border-destructive/50 bg-gradient-to-b from-destructive/10 to-destructive/5"
        )}>
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-2">
              <div className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full",
                isPassed ? "bg-success/20" : "bg-destructive/20"
              )}>
                <Trophy className={cn(
                  "h-8 w-8",
                  isPassed ? "text-success" : "text-destructive"
                )} />
              </div>
            </div>
            <CardTitle className="text-xl">
              {isPassed ? "合格ライン達成!" : "もう少し頑張りましょう"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold mb-2">
              <span className={isPassed ? "text-success" : "text-destructive"}>
                {accuracy}
              </span>
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              正答率（合格ライン: 70%）
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20 mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold">{correct}</p>
              <p className="text-xs text-muted-foreground">正解</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20 mb-2">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-2xl font-bold">{total - correct}</p>
              <p className="text-xs text-muted-foreground">不正解</p>
            </CardContent>
          </Card>
        </div>

        {/* Total Questions */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">解答した問題数</p>
                <p className="text-sm text-muted-foreground">{year}年度</p>
              </div>
            </div>
            <p className="text-2xl font-bold">{total}<span className="text-sm font-normal text-muted-foreground">問</span></p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => router.push(`/quiz/${year}`)}
            className="w-full"
            size="lg"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            もう一度挑戦する
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            ホームに戻る
          </Button>
        </div>
      </div>
    </main>
  );
}
