"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { getUserStats, getQuestionCount } from "@/lib/firebase/firestore";
import { YEARS } from "@/lib/firebase/types";
import { YearCard } from "./year-card";
import { StatsCard } from "./stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function HomePage() {
  const { user, loading, signOut, isDemo } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    todayAnswered: 0,
    todayCorrect: 0,
    totalAnswered: 0,
    totalCorrect: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchStats() {
      if (user) {
        try {
          const userStats = await getUserStats(user.uid);
          setStats({
            todayAnswered: userStats.todayAnswered,
            todayCorrect: userStats.todayCorrect,
            totalAnswered: userStats.totalAnswered,
            totalCorrect: userStats.totalCorrect,
          });
        } catch (error) {
          console.error("Failed to fetch stats:", error);
        } finally {
          setIsLoadingStats(false);
        }
      }
    }

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  if (loading) {
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
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-[family-name:var(--font-logo)] text-foreground">kashikin</span>
            {isDemo && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                DEMO
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-sm px-2">
                設定
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-sm px-2" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-16 pb-6 space-y-6">
        {!isLoadingStats && (
          <StatsCard
            todayAnswered={stats.todayAnswered}
            todayCorrect={stats.todayCorrect}
            totalAnswered={stats.totalAnswered}
            totalCorrect={stats.totalCorrect}
          />
        )}

        <section className="space-y-3">
          <Link href="/bookmarks">
            <Card className="cursor-pointer transition-all hover:bg-secondary/50 hover:border-accent/50">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">保存した問題</h3>
                  <p className="text-sm text-muted-foreground">
                    ブックマークした問題を見直す
                  </p>
                </div>
                <span className="text-muted-foreground">&gt;</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/review">
            <Card className="cursor-pointer transition-all hover:bg-secondary/50 hover:border-accent/50">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">間違えた問題を復習</h3>
                  <p className="text-sm text-muted-foreground">
                    過去に間違えた問題を再挑戦
                  </p>
                </div>
                <span className="text-muted-foreground">&gt;</span>
              </CardContent>
            </Card>
          </Link>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">年度を選択</h2>
          <div className="space-y-3">
            {YEARS.map((year) => (
              <YearCard key={year} year={year} questionCount={getQuestionCount(year)} />
            ))}
          </div>
        </section>

        <section className="pt-4 border-t border-border">
          <Link href="/report">
            <Card className="cursor-pointer transition-all hover:bg-secondary/50">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">問題・不具合の報告</h3>
                  <p className="text-sm text-muted-foreground">
                    問題の誤りやシステムの不具合を報告
                  </p>
                </div>
                <span className="text-muted-foreground">&gt;</span>
              </CardContent>
            </Card>
          </Link>
        </section>
      </div>
    </main>
  );
}
