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
    <div className="flex min-h-[80vh] items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <h2 className="text-lg font-semibold">kashikin analytics</h2>
          <p className="text-xs text-neutral-500">note.com creator dashboard</p>
        </div>
        <label className="block text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">ユーザーID</span>
          <input
            type="text"
            autoComplete="username"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </label>
        <label className="block text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">パスワード</span>
          <input
            type="password"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1 w-full rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
          />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          ログイン
        </button>
        <p className="text-center text-[10px] text-neutral-500">
          Authorized access only
        </p>
      </form>
    </div>
  );
}
