import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "note analyzer dashboard",
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
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <h1 className="text-xl font-semibold">note analyzer dashboard</h1>
            <p className="text-sm text-neutral-500">
              note_analyzer.py が出力した CSV を読み込んで可視化します
            </p>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
