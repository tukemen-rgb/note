"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">利用規約および個人情報の取り扱いについて</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <p>
              「ラーメン部（以下、当部）」が提供する本アプリ（以下、本サービス）をご利用いただくにあたり、以下の通り規約を定めます。ユーザーの皆様は、本規約に同意した上で本サービスをご利用ください。
            </p>

            <section className="space-y-2">
              <h2 className="font-bold text-base">1. 個人情報の収集と利用目的</h2>
              <p>当部は、ユーザーからお預かりした個人情報（主にメールアドレス）を以下の目的の範囲内でのみ、大切に保有・活用させていただきます。</p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>パスワードの再設定時の本人確認</li>
                <li>本サービスに関する重要なリマインド通知やアップデートのお知らせ</li>
                <li>ユーザーからのお問い合わせへの対応</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base">2. データの保有と管理</h2>
              <p><span className="font-medium">情報の管理:</span> お預かりした個人情報は、当部が責任を持って厳重に管理し、本人の同意なく第三者に提供することはありません。</p>
              <p><span className="font-medium">退会後の記録:</span> ユーザーが本サービスを退会した後も、学習記録や成績データ等の統計情報は、サービスの改善や分析を目的として当部が継続して保有できるものとします。</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base">3. 禁止事項</h2>
              <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>他のユーザーのアカウントを不正に利用する行為</li>
                <li>本サービスのサーバーやネットワークに過度な負荷をかける行為</li>
                <li>その他、当部が不適切と判断する行為</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base">4. 免責事項</h2>
              <ul className="list-disc list-inside pl-4 space-y-1">
                <li>当部は、本サービスの内容の正確性や安全性を保証するものではありません。</li>
                <li>本サービスの利用によって生じたトラブルや損害（データの消失等を含む）について、当部は一切の責任を負いません。</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base">5. 利用規約の変更</h2>
              <p>当部は、必要と判断した場合には、ユーザーに通知することなく本規約を変更することができるものとします。変更後の規約は、本アプリ上に表示した時点から効力を生じるものとします。</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base">6. 退会について</h2>
              <p>ユーザーがアカウントの削除（退会）を希望する場合、アプリ内の所定の手続きにより、いつでも退会することができます。退会後はログインが必要な機能は利用できなくなります。</p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-base">7. 広告の配信について</h2>
              <p>当アプリでは、第三者配信事業者である「Google AdSense」を利用して広告を表示しています。</p>
              <p>Googleなどの第三者配信事業者は、Cookie（クッキー）を使用して、ユーザーが当アプリや他のウェブサイトに過去にアクセスした際の情報に基づいて広告を配信します。</p>
              <p>Googleが広告Cookieを使用することにより、ユーザーが当アプリや他のサイトにアクセスした際の情報に基づいて、Googleやそのパートナーが適切な広告をユーザーに表示できます。</p>
              <p>ユーザーは、Google広告設定でパーソナライズ広告を無効にできます。または、www.aboutads.info にアクセスすれば、第三者配信事業者がパーソナライズ広告の掲載で使用する Cookie を無効にできます。</p>
            </section>

            <section className="space-y-2 pt-4 border-t border-border">
              <p className="text-muted-foreground">附則</p>
              <p className="text-muted-foreground">2026年4月13日 制定</p>
              <p className="text-muted-foreground">開発・運営：ラーメン部</p>
            </section>

            <div className="pt-4">
              <Button onClick={() => router.back()} variant="outline" className="w-full">
                戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
