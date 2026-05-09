# kashikin analytics dashboard

note.com クリエイターを分析する Next.js (App Router) アプリ。

- `/login` 簡易ログイン (localStorage)
- `/` ダッシュボード (キーワード分析 / CSV取込)
- `/api/analyze` サーバ側で note.com 公開API を呼ぶエンドポイント

## セットアップ

```bash
cd dashboard
cp .env.example .env.local   # ID / パスワードを編集
npm install
npm run dev
```

http://localhost:3000/login → ログイン → ダッシュボード。

## 認証について

ログインは `NEXT_PUBLIC_LOGIN_ID` / `NEXT_PUBLIC_LOGIN_PASSWORD` を比較するクライアント側ゲートです。`NEXT_PUBLIC_` 付きの環境変数はブラウザに露出するため**簡易用途のみ**。本格運用する場合は NextAuth.js などに差し替えてください。

## デプロイ (Vercel)

```bash
npx vercel
```

その後 Vercel の Project Settings → Environment Variables に
`NEXT_PUBLIC_LOGIN_ID` と `NEXT_PUBLIC_LOGIN_PASSWORD` を追加。Domains で `kashikin.com` を割り当てれば完成。

## API レート / 上限

`/api/analyze` は内部で note.com の `/api/v2/...` を順番に叩きます。

- `max` (クリエイター数): 1〜25 (デフォルト 10)
- `days` (分析期間): 7〜365 (デフォルト 90)
- 各リクエスト間 600ms スリープ、429/5xx は指数バックオフで最大3回リトライ

Vercel Hobby プランの関数タイムアウトは 60 秒です。`max` を大きくする場合は Pro 以上にするか、外部ジョブで CSV を生成して取り込む運用に切り替えてください。

## CSV 取込

サーバ取得が使えない場合、`note_analyzer.py` で生成した CSV をアップロードしても同じ画面で閲覧できます。
