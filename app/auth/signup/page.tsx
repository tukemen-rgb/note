"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { isUsernameAvailable } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// 生まれ年のオプション（1940年〜2010年）
const BIRTH_YEARS = Array.from({ length: 71 }, (_, i) => 2010 - i);

// 職業のオプション
const OCCUPATIONS = [
  { value: "finance", label: "銀行・証券・保険" },
  { value: "lending", label: "消費者金融・カード" },
  { value: "real_estate", label: "リース・レンタル" },
  { value: "insurance", label: "不動産・住宅" },
  { value: "accounting", label: "士業・コンサル" },
  { value: "legal", label: "小売・流通・飲食" },
  { value: "government", label: "IT・通信・製造" },
  { value: "student", label: "公務員・団体" },
  { value: "self_employed", label: "学生" },
  { value: "corporate", label: "その他" },
];

// 秘密の質問のオプション
const SECRET_QUESTIONS = [
  { value: "pet", label: "初めて飼ったペットの名前は？" },
  { value: "school", label: "出身小学校の名前は？" },
  { value: "mother", label: "母親の旧姓は？" },
  { value: "city", label: "生まれた都市は？" },
  { value: "food", label: "子供の頃の好きな食べ物は？" },
  { value: "friend", label: "親友の名前は？" },
];

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");
  const [secretQuestion, setSecretQuestion] = useState<string>("");
  const [secretAnswer, setSecretAnswer] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  // ユーザー名の重複チェック
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const available = await isUsernameAvailable(username);
        if (!available) {
          setUsernameError("このユーザー名は既に使用されています");
        } else {
          setUsernameError(null);
        }
      } catch {
        // Ignore errors during check
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError("利用規約に同意してください");
      return;
    }

    if (!username || username.length < 3) {
      setError("ユーザー名は3文字以上で入力してください");
      return;
    }

    if (usernameError) {
      setError(usernameError);
      return;
    }

    if (!birthYear) {
      setError("生まれ年を選択してください");
      return;
    }

    if (!occupation) {
      setError("職業を選択してください");
      return;
    }

    if (!secretQuestion) {
      setError("秘密の質問を選択してください");
      return;
    }

    if (!secretAnswer || secretAnswer.length < 1) {
      setError("秘密の質問の答えを入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, {
        username: username.toLowerCase(),
        birthYear: parseInt(birthYear),
        occupation,
        secretQuestion,
        secretAnswer,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("このメールアドレスは既に使用されています");
        } else if (err.message.includes("weak-password")) {
          setError("パスワードが弱すぎます。より強力なパスワードを設定してください");
        } else if (err.message.includes("invalid-email")) {
          setError("有効なメールアドレスを入力してください");
        } else {
          setError("登録に失敗しました。もう一度お試しください");
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
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <CardDescription>
            アカウントを作成して学習を始めましょう
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
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
                placeholder="3文字以上で入力"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              {usernameChecking && (
                <p className="text-xs text-muted-foreground mt-1">確認中...</p>
              )}
              {usernameError && (
                <p className="text-xs text-destructive mt-1">{usernameError}</p>
              )}
              {!usernameError && !usernameChecking && username.length >= 3 && (
                <p className="text-xs text-accent mt-1">このユーザー名は使用可能です</p>
              )}
            </Field>
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
              <FieldLabel htmlFor="occupation">職業</FieldLabel>
              <Select value={occupation} onValueChange={setOccupation}>
                <SelectTrigger id="occupation">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATIONS.map((occ) => (
                    <SelectItem key={occ.value} value={occ.value}>
                      {occ.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="secretQuestion">秘密の質問</FieldLabel>
              <Select value={secretQuestion} onValueChange={setSecretQuestion}>
                <SelectTrigger id="secretQuestion">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {SECRET_QUESTIONS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="secretAnswer">秘密の質問の答え</FieldLabel>
              <Input
                id="secretAnswer"
                type="text"
                placeholder="答えを入力"
                value={secretAnswer}
                onChange={(e) => setSecretAnswer(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                パスワードを忘れた場合の復旧に使用します
              </p>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">パスワード</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="6文字以上で入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">パスワード（確認）</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="もう一度入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                <Link href="/terms" className="text-accent hover:underline" target="_blank">
                  利用規約および個人情報の取り扱い
                </Link>
                に同意します
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || !agreedToTerms || !!usernameError}>
              {isLoading ? "登録中..." : "アカウントを作成"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              既にアカウントをお持ちですか？{" "}
              <Link href="/auth/login" className="text-accent hover:underline">
                ログイン
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
