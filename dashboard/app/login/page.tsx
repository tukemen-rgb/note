"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_ID = "admin";
const DEFAULT_PW = "kashikin2026";

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const expectedId = process.env.NEXT_PUBLIC_LOGIN_ID || DEFAULT_ID;
    const expectedPw = process.env.NEXT_PUBLIC_LOGIN_PASSWORD || DEFAULT_PW;
    if (id === expectedId && pw === expectedPw) {
      localStorage.setItem("kashikin_auth", "1");
      router.push("/");
    } else {
      setError("IDまたはパスワードが違います");
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-md border border-[var(--border)] bg-[var(--surface)] p-7"
      >
        <div>
          <p className="text-xs tracking-widest text-[var(--muted)]">
            KASHIKIN ANALYTICS
          </p>
          <h2 className="mt-1 text-lg font-bold">ログイン</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            管理者から付与された ID とパスワードを入力してください。
          </p>
        </div>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">ユーザーID</span>
          <input
            type="text"
            autoComplete="username"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">パスワード</span>
          <input
            type="password"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90"
        >
          ログイン
        </button>
        <p className="text-center text-[10px] text-[var(--muted)]">
          Authorized access only
        </p>
      </form>
    </div>
  );
}
