"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface YearCardProps {
  year: number;
  questionCount?: number;
  completedCount?: number;
}

export function YearCard({ year, questionCount = 50, completedCount = 0 }: YearCardProps) {
  const progress = questionCount > 0 ? (completedCount / questionCount) * 100 : 0;
  const isBeta = year === 2025;

  return (
    <Link href={`/quiz/${year}`}>
      <Card className="group cursor-pointer transition-all hover:bg-secondary/50 hover:border-accent/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{year}年度</h3>
                {isBeta && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    BETA
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {completedCount > 0 
                  ? `${completedCount}/${questionCount}問 完了`
                  : `全${questionCount}問`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {completedCount > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-secondary">
                  <div 
                    className="h-2 rounded-full bg-accent transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
            <span className="text-muted-foreground group-hover:text-accent transition-colors">&gt;</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
