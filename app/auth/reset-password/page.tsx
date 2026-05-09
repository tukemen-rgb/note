"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("user-not-found")) {
          setError("このメールアドレスは登録されていません");
        } else if (err.message.includes("invalid-email")) {
          setError("有効なメールアドレスを入力してください");
        } else if (err.message.includes("too-many-requests")) {
          setError("リクエストが多すぎます。しばらく待ってから再試行してください");
        } else {
          setError("エラーが発生しました。もう一度お試しください");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">パスワード再設定</CardTitle>
          <CardDescription>
            登録済みのメールアドレスを入力してください
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <p>{error}</p>
              </div>
            )}
            {success ? (
              <div className="rounded-lg bg-accent/10 p-4 text-sm text-center space-y-2">
                <p className="font-medium">メールを送信しました</p>
                <p className="text-muted-foreground">
                  {email} 宛にパスワード再設定用のリンクを送信しました。メールをご確認ください。
                </p>
              </div>
            ) : (
              <Field>
                <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {!success && (
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "送信中..." : "再設定メールを送信"}
              </Button>
            )}
            <p className="text-sm text-muted-foreground text-center">
              <Link href="/auth/login" className="text-accent hover:underline">
                ログインに戻る
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
