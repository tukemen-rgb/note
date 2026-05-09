"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  getQuestionsByYear,
  saveLearningHistory,
  addBookmark,
  removeBookmark,
  isBookmarked as checkIsBookmarked,
} from "@/lib/firebase/firestore";
import type { Question } from "@/lib/firebase/types";
import { QuizQuestion } from "./quiz-question";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

interface QuizPageProps {
  year: number;
}

interface AnswerRecord {
  questionId: string;
  questionNumber: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

export function QuizPage({ year }: QuizPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { settings, getButtonSizeClass } = useSettings();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchQuestions() {
      if (!user) return;
      
      try {
        const fetchedQuestions = await getQuestionsByYear(year);
        
        // If no questions in DB, use sample questions for demo
        if (fetchedQuestions.length === 0) {
          setQuestions(generateSampleQuestions(year));
        } else {
          setQuestions(fetchedQuestions);
        }

        // Check bookmarks for all questions
        const bookmarkChecks = await Promise.all(
          fetchedQuestions.map(async (q) => {
            const bookmarked = await checkIsBookmarked(user.uid, q.year, q.questionNumber);
            return bookmarked ? q.id : null;
          })
        );
        setBookmarkedQuestions(new Set(bookmarkChecks.filter(Boolean) as string[]));
      } catch (error) {
        console.error("Failed to fetch questions:", error);
        // Use sample questions on error
        setQuestions(generateSampleQuestions(year));
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchQuestions();
    }
  }, [user, year]);

  const handleAnswer = useCallback(async (selectedAnswer: number, isCorrect: boolean) => {
    if (!user || !questions[currentIndex]) return;

    const question = questions[currentIndex];
    
    // Save to learning history
    try {
      await saveLearningHistory(user.uid, {
        questionId: question.id,
        year: question.year,
        questionNumber: question.questionNumber,
        isCorrect,
        selectedAnswer,
      });
    } catch (error) {
      console.error("Failed to save learning history:", error);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: question.id,
        questionNumber: question.questionNumber,
        selectedAnswer,
        isCorrect,
      },
    ]);
    setIsAnswered(true);
  }, [user, questions, currentIndex]);

  const handleToggleBookmark = useCallback(async () => {
    if (!user || !questions[currentIndex]) return;

    const question = questions[currentIndex];
    const isCurrentlyBookmarked = bookmarkedQuestions.has(question.id);

    try {
      if (isCurrentlyBookmarked) {
        await removeBookmark(user.uid, question.year, question.questionNumber);
        setBookmarkedQuestions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(question.id);
          return newSet;
        });
      } else {
        await addBookmark(user.uid, {
          questionId: question.id,
          year: question.year,
          questionNumber: question.questionNumber,
        });
        setBookmarkedQuestions((prev) => new Set(prev).add(question.id));
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  }, [user, questions, currentIndex, bookmarkedQuestions]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsAnswered(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleGoToResults = () => {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalCount = answers.length;
    router.push(`/quiz/${year}/result?correct=${correctCount}&total=${totalCount}`);
  };

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-accent" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground mb-4">問題が見つかりませんでした</p>
        <Button onClick={() => router.push("/")}>
          ホームに戻る
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            戻る
          </Button>
          <h1 className="font-semibold">{year}年度</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        {!isComplete ? (
          <>
            <QuizQuestion
              key={currentQuestion.id}
              question={currentQuestion}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
              isBookmarked={bookmarkedQuestions.has(currentQuestion.id)}
              onAnswer={handleAnswer}
              onToggleBookmark={handleToggleBookmark}
            />

            {isAnswered && (
              <div className="mt-6">
                <Button 
                  onClick={handleNext} 
                  className={cn("w-full", getButtonSizeClass(settings.buttonSize))}
                >
                  {currentIndex < questions.length - 1 ? "次の問題へ" : "結果を見る"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">お疲れ様でした</h2>
            <p className="text-muted-foreground mb-6">
              全{questions.length}問の演習が完了しました
            </p>
            <Button onClick={handleGoToResults} size="lg">
              結果を確認する
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

// Sample questions for demo when DB is empty
function generateSampleQuestions(year: number): Question[] {
  return [
    {
      id: `${year}_1`,
      year,
      questionNumber: 1,
      category: "法及び関係法令に関すること",
      questionText: "貸金業法において、貸金業を営むために必要な登録について、正しいものはどれか。",
      choices: [
        "貸金業を営もうとする者は、内閣総理大臣の登録を受けなければならない",
        "貸金業を営もうとする者は、都道府県知事または財務局長の登録を受けなければならない",
        "貸金業を営もうとする者は、日本貸金業協会の登録を受けなければならない",
        "貸金業を営もうとする者は、金融庁長官の登録を受けなければならない",
      ],
      correctAnswer: 1,
      explanation: "貸金業法第3条により、貸金業を営もうとする者は、二以上の都道府県の区域内に営業所等を設置する場合は内閣総理大臣（財務局長に委任）、一の都道府県の区域内のみに営業所等を設置する場合は当該都道府県知事の登録を受けなければなりません。",
    },
    {
      id: `${year}_2`,
      year,
      questionNumber: 2,
      category: "貸付け及び貸付けに付随する取引に関する法令及び実務に関すること",
      questionText: "総量規制について、正しいものはどれか。",
      choices: [
        "総量規制は、すべての貸金業者からの借入れの合計額が年収の2分の1を超えてはならないとするものである",
        "総量規制は、すべての貸金業者からの借入れの合計額が年収の3分の1を超えてはならないとするものである",
        "総量規制は、1つの貸金業者からの借入れの合計額が年収の3分の1を超えてはならないとするものである",
        "総量規制は、住宅ローンを含むすべての借入れの合計額が年収の3分の1を超えてはならないとするものである",
      ],
      correctAnswer: 1,
      explanation: "貸金業法第13条の2により、貸金業者は、個人である資金需要者に対し、当該資金需要者の返済能力を超える貸付けの契約を締結してはなりません。具体的には、貸金業者からの借入残高が年収の3分の1を超える場合、新規の借入れはできなくなります（総量規制）。",
    },
    {
      id: `${year}_3`,
      year,
      questionNumber: 3,
      category: "資金需要者等の保護に関すること",
      questionText: "貸金業者の禁止行為について、正しいものはどれか。",
      choices: [
        "資金需要者等の利益の保護に支障を生ずることがない場合は、威迫する言動をしても禁止行為にはあたらない",
        "正当な理由なく、午後9時から午前8時までの間に電話やFAXで取立てを行うことは禁止されている",
        "債務者から弁済を受けた場合でも、受取証書の交付は任意である",
        "貸金業者は、契約締結時に書面を交付する義務はない",
      ],
      correctAnswer: 1,
      explanation: "貸金業法第21条により、貸金業者は、債権の取立てに当たり、人を威迫し、又は人の私生活若しくは業務の平穏を害するような言動をしてはなりません。また、正当な理由なく、午後9時から午前8時までの間に、債務者等に電話をかけ、若しくはファクシミリ装置を用いて送信し、又は債務者等の居宅を訪問してはなりません。",
    },
  ];
}
