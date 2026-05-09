"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { getBookmarks, getQuestionById } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { Bookmark, Question } from "@/lib/firebase/types";

interface BookmarkWithQuestion extends Bookmark {
  question?: Question;
}

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkWithQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchBookmarks() {
      if (user) {
        try {
          const userBookmarks = await getBookmarks(user.uid);
          
          // Fetch question details for each bookmark
          const bookmarksWithQuestions = await Promise.all(
            userBookmarks.map(async (bookmark) => {
              const question = await getQuestionById(bookmark.questionId);
              return { ...bookmark, question: question || undefined };
            })
          );
          
          setBookmarks(bookmarksWithQuestions);
        } catch (error) {
          console.error("Failed to fetch bookmarks:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              戻る
            </Button>
            <h1 className="font-bold text-lg">保存した問題</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-24 pb-6">
        {bookmarks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">保存した問題はありません</p>
              <p className="text-sm text-muted-foreground mb-6">
                問題演習中に右上の「保存」ボタンで問題を保存できます
              </p>
              <Button onClick={() => router.push("/")}>
                ホームに戻る
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {bookmarks.length}件の保存した問題
            </p>
            {bookmarks.map((bookmark) => (
              <Link 
                key={bookmark.id} 
                href={`/bookmarks/${bookmark.questionId}`}
              >
                <Card className="cursor-pointer transition-all hover:bg-secondary/50 hover:border-accent/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            {bookmark.year}年度
                          </Badge>
                          <Badge variant="outline">
                            第{bookmark.questionNumber}問
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {bookmark.question?.questionText.slice(0, 100) || "問題を読み込み中..."}
                          {(bookmark.question?.questionText.length || 0) > 100 ? "..." : ""}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0">&gt;</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
