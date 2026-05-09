"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("Firebase is not configured")) {
          setError("システムエラーが発生しました。管理者にお問い合わせください");
        } else if (err.message.includes("invalid-credential")) {
          setError("メールアドレスまたはパスワードが正しくありません");
        } else if (err.message.includes("too-many-requests")) {
          setError("ログイン試行回数が多すぎます。しばらく待ってから再試行してください");
        } else {
          setError("ログインに失敗しました。もう一度お試しください");
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
          <p className="text-3xl font-[family-name:var(--font-logo)] text-foreground mb-2">kashikin</p>
          <CardTitle className="text-xl">ログイン</CardTitle>
          <CardDescription>
            貸金業務取扱主任者 試験対策
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

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
            <Field>
              <FieldLabel htmlFor="password">パスワード</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <div className="flex flex-col gap-1 text-sm">
              <Link href="/auth/reset-password" className="text-accent hover:underline">
                パスワードを再設定する
              </Link>
              <Link href="/auth/recover" className="text-accent hover:underline">
                ユーザー名・メールアドレスを忘れた場合
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              アカウントをお持ちでないですか？{" "}
              <Link href="/auth/signup" className="text-accent hover:underline">
                新規登録
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
