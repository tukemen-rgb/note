"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { submitReport, getQuestionsForYear, getQuestionCount } from "@/lib/firebase/firestore";
import { YEARS, type ReportType } from "@/lib/firebase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { 
    value: "question_error", 
    label: "問題・回答に誤りがある", 
    description: "問題文、選択肢、正解、解説に間違いがある場合" 
  },
  { 
    value: "system_error", 
    label: "システムが動かない", 
    description: "画面が表示されない、ボタンが反応しないなど" 
  },
  { 
    value: "data_lost", 
    label: "データが消えた", 
    description: "学習履歴やブックマークが消えた場合" 
  },
  { 
    value: "other", 
    label: "その他", 
    description: "上記以外のお問い合わせ" 
  },
];

export default function ReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<{ questionNumber: number; preview: string }[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (selectedYear) {
      const yearQuestions = getQuestionsForYear(selectedYear);
      setQuestions(yearQuestions);
      setSelectedQuestion(null);
    }
  }, [selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType) {
      setError("通報の種類を選択してください");
      return;
    }
    
    if (reportType === "question_error" && (!selectedYear || !selectedQuestion)) {
      setError("年度と問題番号を選択してください");
      return;
    }
    
    if (!comment.trim()) {
      setError("詳細を入力してください");
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitReport(user.uid, {
        reportType,
        year: selectedYear || undefined,
        questionNumber: selectedQuestion || undefined,
        comment: comment.trim(),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error("Failed to submit report:", err);
      setError("送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (!user) return null;

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>送信完了</CardTitle>
              <CardDescription>
                ご報告ありがとうございます。内容を確認し、対応いたします。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => router.push("/")} 
                className="w-full"
              >
                ホームに戻る
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setReportType(null);
                  setSelectedYear(null);
                  setSelectedQuestion(null);
                  setComment("");
                }}
                className="w-full"
              >
                別の内容を通報する
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="font-bold text-lg">問題・不具合の報告</h1>
          <Link href="/">
            <Button variant="ghost" size="sm">
              戻る
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-20 pb-8 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <FieldLabel>通報の種類</FieldLabel>
            <div className="space-y-2">
              {REPORT_TYPES.map((type) => (
                <Card 
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    reportType === type.value 
                      ? "border-accent bg-accent/10" 
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => {
                    setReportType(type.value);
                    if (type.value !== "question_error") {
                      setSelectedYear(null);
                      setSelectedQuestion(null);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          reportType === type.value 
                            ? "border-accent" 
                            : "border-muted-foreground"
                        }`}
                      >
                        {reportType === type.value && (
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </FieldGroup>

          {reportType === "question_error" && (
            <FieldGroup>
              <Field>
                <FieldLabel>年度</FieldLabel>
                <select
                  value={selectedYear || ""}
                  onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">年度を選択</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}年 ({getQuestionCount(year)}問)
                    </option>
                  ))}
                </select>
              </Field>

              {selectedYear && questions.length > 0 && (
                <Field>
                  <FieldLabel>問題番号</FieldLabel>
                  <select
                    value={selectedQuestion || ""}
                    onChange={(e) => setSelectedQuestion(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">問題を選択</option>
                    {questions.map((q) => (
                      <option key={q.questionNumber} value={q.questionNumber}>
                        問{q.questionNumber}: {q.preview}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </FieldGroup>
          )}

          <Field>
            <FieldLabel>詳細</FieldLabel>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                reportType === "question_error"
                  ? "誤っている箇所と正しい内容を記載してください"
                  : "詳しい状況を記載してください"
              }
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
            />
          </Field>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !reportType}
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                送信中...
              </>
            ) : (
              "送信する"
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
