# v0 プロジェクトに反映する修正

`cb9da937-b_6dQt6p7dIwD.zip` を取り込んで `npx tsc --noEmit` を走らせると以下の型エラーが
出ていました。修正後のファイルをこのフォルダに置いてあるので、v0 プロジェクトの同名
パスへ上書きしてください。

| 元のパス | 修正版 | 何を直したか |
|---|---|---|
| `lib/analytics/csv.ts` | `csv.ts` | `Papa.ParseLocalConfig<Record<string, string>, File>` で型を明示し、`papaparse` 5.x の `complete(results, file)` シグネチャに合わせた |
| `lib/firebase/firestore.ts` | `firestore.ts` | `Timestamp` を型として import し、デモモードで `new Date()` を `Timestamp` に cast |
| `components/quiz-page/quiz-page.tsx` | `quiz-page.tsx` | `generateSampleQuestions` の `options:` を `Question` 型に揃えて `choices:` に変更 (3 箇所) |
| `package.json` | `package.json` | `devDependencies` に `@types/papaparse@^5.3.14` を追加 |

## 反映後の確認

```bash
pnpm install        # 新しい types を入れる
pnpm tsc --noEmit   # クリーンになるはず
pnpm build          # Next.js も成功するはず
```

`pnpm build` が通れば、Vercel の自動デプロイも問題なく走ります。
