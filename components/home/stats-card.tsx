"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  todayAnswered: number;
  todayCorrect: number;
  totalAnswered: number;
  totalCorrect: number;
}

export function StatsCard({ 
  todayAnswered, 
  todayCorrect, 
  totalAnswered, 
  totalCorrect 
}: StatsCardProps) {
  const todayAccuracy = todayAnswered > 0 ? Math.round((todayCorrect / todayAnswered) * 100) : 0;
  const totalAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">学習状況</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">今日の学習</p>
            <p className="text-2xl font-bold">{todayAnswered}<span className="text-sm font-normal text-muted-foreground">問</span></p>
            {todayAnswered > 0 && (
              <p className="text-xs text-accent">正答率 {todayAccuracy}%</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">累計学習</p>
            <p className="text-2xl font-bold">{totalAnswered}<span className="text-sm font-normal text-muted-foreground">問</span></p>
            {totalAnswered > 0 && (
              <p className="text-xs text-accent">正答率 {totalAccuracy}%</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
