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

ログインは `NEXT_PUBLIC_LOGIN_ID` / `NEXT_PUBLIC_LOGIN_PASSWORD` を比較する
クライアント側ゲートです。デフォルトは **ID: `s31747` / パスワード: `s31747`**。

`NEXT_PUBLIC_` 付きの環境変数はブラウザに露出するため**簡易用途のみ**で、
本格運用するなら NextAuth.js などに差し替えてください。

## デプロイ (Vercel)

```bash
cd dashboard
npx vercel            # 初回のみ。プロジェクトを作成
npx vercel --prod     # 本番デプロイ
```

Vercel ダッシュボードの操作:

1. **Settings → Environment Variables** に以下を追加（Production / Preview 両方）
   - `NEXT_PUBLIC_LOGIN_ID` = `s31747`
   - `NEXT_PUBLIC_LOGIN_PASSWORD` = `s31747`
2. **Settings → Domains** に `kashikin.com` を追加し、Vercel が表示する DNS 設定（A レコードまたは CNAME）をドメイン管理側に設定
3. デプロイ完了後 `https://kashikin.com/login` でログイン

## API レート / 上限

`/api/analyze` は内部で note.com の `/api/v2/...` を順番に叩きます。

- `max` (クリエイター数): 1〜25 (デフォルト 10)
- `days` (分析期間): 7〜365 (デフォルト 90)
- 各リクエスト間 600ms スリープ、429/5xx は指数バックオフで最大3回リトライ

Vercel Hobby プランの関数タイムアウトは 60 秒です。`max` を大きくする場合は Pro 以上にするか、外部ジョブで CSV を生成して取り込む運用に切り替えてください。

## 総合ランキング

分析結果は **総合スコア (0-100)** で自動的にランキング化されます。スコアはデータセット内で
各指標を min-max 正規化したうえで重み付け平均したもので、配点は以下のとおりです:

- フォロワー数 30%
- エンゲージメント率 25%
- 投稿頻度 20%
- 平均スキ数 15%
- 累計スキ数 10%

ランキング表の上部にある「アカウント検索」入力で、urlname / nickname / プロフィール本文を
対象に絞り込みできます。順位は絞り込み前のランキングを保持するので、検索でヒットした
アカウントが「全体で何位なのか」をその場で確認できます。

## CSV 取込

サーバ取得が使えない場合、`note_analyzer.py` で生成した CSV をアップロードしても同じ画面で閲覧できます。

## 推定ビュー数について

note.com の公開 API ではビュー数が取得できないため、「最高/最低投稿」はスキ数で代替し、
推定ビュー数として `likes × 10 / × 20 / × 33` の 3 列を併記しています。これは note
公式値ではなく、複数のクリエイターが公開した実例から逆算した参考レンジです。記事タイプや
流入経路で大きく変動するので、絶対値ではなく目安として扱ってください。算出根拠と元データは
[`/data/reference/`](../data/reference/) を参照。
