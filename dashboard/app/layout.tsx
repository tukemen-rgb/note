import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kashikin analytics",
  description: "note.com クリエイター分析ダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <p className="text-xs tracking-widest text-[var(--muted)]">
              KASHIKIN ANALYTICS
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--text)]">
              note クリエイター分析ダッシュボード
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              note.com の公開情報からアカウント・投稿・ハッシュタグ単位で集計するための分析画面です。
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
