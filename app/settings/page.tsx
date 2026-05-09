"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings, fontSizeLabels, type FontSize } from "@/lib/settings-context";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SettingsPage() {
  const router = useRouter();
  const { deleteAccount, isDemo } = useAuth();
  const {
    settings,
    setTheme,
    setButtonSize,
    setQuestionSize,
    setChoiceSize,
    setExplanationSize,
    getFontSizeClass,
    getButtonSizeClass,
  } = useSettings();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAgreed, setDeleteAgreed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fontSizes: FontSize[] = [1, 2, 3, 4, 5, 6, 7];

  const handleDeleteAccount = async () => {
    if (!deleteAgreed) return;
    
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      await deleteAccount();
      router.push("/auth/login");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleteError("退会処理に失敗しました。再度ログインしてからお試しください。");
      setIsDeleting(false);
    }
  };

  const SizeSelector = ({
    label,
    value,
    onChange,
    preview,
    previewType = "text",
  }: {
    label: string;
    value: FontSize;
    onChange: (size: FontSize) => void;
    preview: string;
    previewType?: "text" | "button";
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {fontSizes.map((size) => (
            <Button
              key={size}
              variant={value === size ? "default" : "outline"}
              className="h-10 p-0"
              onClick={() => onChange(size)}
            >
              <span className="text-xs">{size}</span>
            </Button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>iPhone SE</span>
          <span>現在: {fontSizeLabels[value]}</span>
          <span>PC</span>
        </div>
        <div className="p-4 bg-secondary rounded-lg">
          <p className="text-muted-foreground text-xs mb-2">プレビュー:</p>
          {previewType === "button" ? (
            <Button className={getButtonSizeClass(value)}>{preview}</Button>
          ) : (
            <p className={getFontSizeClass(value)}>{preview}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            戻る
          </Button>
          <h1 className="font-bold text-lg">設定</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-20 pb-6 space-y-6">
        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">テーマ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={settings.theme === "dark" ? "default" : "outline"}
                className="flex-1 h-14"
                onClick={() => setTheme("dark")}
              >
                黒背景
              </Button>
              <Button
                variant={settings.theme === "light" ? "default" : "outline"}
                className="flex-1 h-14"
                onClick={() => setTheme("light")}
              >
                白背景
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Button Size */}
        <SizeSelector
          label="ボタンの大きさ"
          value={settings.buttonSize}
          onChange={setButtonSize}
          preview="回答を確定"
          previewType="button"
        />

        {/* Question Size */}
        <SizeSelector
          label="問題文の大きさ"
          value={settings.questionSize}
          onChange={setQuestionSize}
          preview="貸金業法上の用語の定義等に関する次のa〜dの記述のうち、その内容が適切なものの個数を選びなさい。"
        />

        {/* Choice Size */}
        <SizeSelector
          label="選択肢の大きさ"
          value={settings.choiceSize}
          onChange={setChoiceSize}
          preview="貸金業とは、金銭の貸付け又は金銭の貸借の媒介で業として行うものをいう。"
        />

        {/* Explanation Size */}
        <SizeSelector
          label="解説の大きさ"
          value={settings.explanationSize}
          onChange={setExplanationSize}
          preview="正解は3です。貸金業法第2条に規定されている定義に基づいて判断します。"
        />

        {/* Delete Account Section */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">退会</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDeleteConfirm ? (
              <>
                <p className="text-sm text-muted-foreground">
                  アカウントを削除すると、学習履歴やブックマークなどすべてのデータが削除されます。
                </p>
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  退会手続きを開始
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription className="text-sm">
                    <p className="font-bold mb-2">退会に関する注意事項</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>退会後は、すべてのデータが完全に削除されます</li>
                      <li>学習履歴、ブックマーク、設定はすべて失われます</li>
                      <li>退会後にデータを復元することはできません</li>
                      <li>同じメールアドレスで再登録しても、以前のデータは戻りません</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex items-start gap-3 p-4 bg-secondary rounded-lg">
                  <Checkbox
                    id="delete-agree"
                    checked={deleteAgreed}
                    onCheckedChange={(checked) => setDeleteAgreed(checked === true)}
                  />
                  <label htmlFor="delete-agree" className="text-sm cursor-pointer">
                    上記の注意事項を確認し、退会後はデータを復元できないことに同意します
                  </label>
                </div>

                {deleteError && (
                  <p className="text-sm text-destructive">{deleteError}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteAgreed(false);
                      setDeleteError("");
                    }}
                    disabled={isDeleting}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteAccount}
                    disabled={!deleteAgreed || isDeleting}
                  >
                    {isDeleting ? "処理中..." : "退会する"}
                  </Button>
                </div>

                {isDemo && (
                  <p className="text-xs text-muted-foreground text-center">
                    デモモードでは実際のデータは削除されません
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
