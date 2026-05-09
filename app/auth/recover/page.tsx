"use client";

import { useState } from "react";
import Link from "next/link";
import { findUserByUsername, verifyRecoveryAnswers } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 生まれ年のオプション（1940年〜2010年）
const BIRTH_YEARS = Array.from({ length: 71 }, (_, i) => 2010 - i);

// 秘密の質問のオプション
const SECRET_QUESTIONS: Record<string, string> = {
  pet: "初めて飼ったペットの名前は？",
  school: "出身小学校の名前は？",
  mother: "母親の旧姓は？",
  city: "生まれた都市は？",
  food: "子供の頃の好きな食べ物は？",
  friend: "親友の名前は？",
};

type Step = "username" | "verify" | "success";

export default function RecoverPage() {
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [secretQuestion, setSecretQuestion] = useState("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [recoveredEmail, setRecoveredEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await findUserByUsername(username);
      if (!user) {
        setError("このユーザー名は登録されていません");
        return;
      }
      setSecretQuestion(user.secretQuestion);
      setStep("verify");
    } catch {
      setError("エラーが発生しました。もう一度お試しください");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!birthYear) {
      setError("生まれ年を選択してください");
      return;
    }

    if (!secretAnswer) {
      setError("秘密の質問の答えを入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyRecoveryAnswers(
        username,
        parseInt(birthYear),
        secretAnswer
      );

      if (result.success && result.email) {
        setRecoveredEmail(result.email);
        setStep("success");
      } else {
        setError("入力内容が一致しません。もう一度確認してください");
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">アカウント復旧</CardTitle>
          <CardDescription>
            {step === "username" && "ユーザー名を入力してください"}
            {step === "verify" && "本人確認を行います"}
            {step === "success" && "メールアドレスが見つかりました"}
          </CardDescription>
        </CardHeader>

        {step === "username" && (
          <form onSubmit={handleUsernameSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <p>{error}</p>
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="username">ユーザー名</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="ユーザー名を入力"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "確認中..." : "次へ"}
              </Button>
              <Link href="/auth/login" className="text-sm text-accent hover:underline">
                ログインに戻る
              </Link>
            </CardFooter>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifySubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <p>{error}</p>
                </div>
              )}
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm text-muted-foreground">ユーザー名</p>
                <p className="font-medium">{username}</p>
              </div>
              <Field>
                <FieldLabel htmlFor="birthYear">生まれ年</FieldLabel>
                <Select value={birthYear} onValueChange={setBirthYear}>
                  <SelectTrigger id="birthYear">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {BIRTH_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="secretAnswer">
                  {SECRET_QUESTIONS[secretQuestion] || "秘密の質問"}
                </FieldLabel>
                <Input
                  id="secretAnswer"
                  type="text"
                  placeholder="答えを入力"
                  value={secretAnswer}
                  onChange={(e) => setSecretAnswer(e.target.value)}
                  required
                />
              </Field>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "確認中..." : "確認する"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep("username");
                  setError(null);
                }}
                className="text-sm text-accent hover:underline"
              >
                戻る
              </button>
            </CardFooter>
          </form>
        )}

        {step === "success" && (
          <>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-accent/10 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  登録されているメールアドレス
                </p>
                <p className="font-medium text-lg break-all">{recoveredEmail}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                このメールアドレスでパスワードを再設定できます
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Link href="/auth/reset-password" className="w-full">
                <Button className="w-full">
                  パスワードを再設定する
                </Button>
              </Link>
              <Link href="/auth/login" className="text-sm text-accent hover:underline">
                ログインに戻る
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </main>
  );
}
