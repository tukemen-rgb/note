# note analyzer dashboard

`note_analyzer.py` が出力した CSV を読み込んで可視化する Next.js アプリの雛形です。

## セットアップ

```bash
cd dashboard
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開き、CSV を選択するとサマリと一覧が表示されます。

## デプロイ

`vercel` または `vercel deploy` で公開できます。CSV はクライアント側で読むため、サーバ側に保存されません。
