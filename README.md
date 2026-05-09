# note analyzer

note.com 上のクリエイターおよび投稿を分析する CLI と、出力 CSV を可視化する
Next.js ダッシュボードの雛形。

## 構成

- `note_analyzer.py` - Python 製の CLI 本体
- `requirements.txt` - Python 依存関係
- `dashboard/` - Next.js ダッシュボード (任意)

## CLI 使い方

```bash
pip install -r requirements.txt

# プロフィール内キーワードでアカウント検索
python note_analyzer.py user "副業" --max 30 --out users.csv

# 投稿内キーワード検索 (投稿者を集計)
python note_analyzer.py note "ブログ運営" --max 50 --out authors.csv

# ハッシュタグ検索
python note_analyzer.py tag "投資" --max 200 --out tag_invest.csv

# Perplexity でテーマ要約 (任意)
export PERPLEXITY_API_KEY=pplx-xxxxxxxx
python note_analyzer.py user "副業" --max 20 --perplexity --out users.csv
```

### 主な仕様

- データ取得: note.com の公開 JSON API (`/api/v2/searches`,
  `/api/v2/creators/{urlname}`, `/api/v2/creators/{urlname}/contents`,
  `/api/v2/hashtags/{tag}/notes`) を使用。429 / 5xx は指数バックオフでリトライ。
- 分析窓: 既定 90 日 (`--days` で変更可)。投稿頻度 = 投稿数 ÷ 日数 × 7。
- エンゲージメント率 = 期間内スキ数 ÷ (フォロワー数 × 期間内投稿数) × 100。
- 最高 / 最低投稿: 公開 API ではビュー数が取れないため、スキ数で代替。
  タイトル・URL・本文 400 字を CSV に出力。
- CSV: `utf-8-sig` で出力 (Excel で文字化けしない)。
- コンソール: 平均値とエンゲージメント率 TOP10 を表示。

### 注意点

note.com には利用規約と robots.txt があります。本スクリプトは 0.6 秒の待機と
リトライを挟みますが、`--max` を控えめにし、運用ではさらにレートを抑えてください。

## ダッシュボード

`dashboard/` で Next.js (App Router + Tailwind) の雛形を提供しています。
詳細は [`dashboard/README.md`](dashboard/README.md) を参照。
