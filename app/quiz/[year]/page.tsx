import { QuizPage } from "@/components/quiz-page/quiz-page";

interface Props {
  params: Promise<{ year: string }>;
}

export default async function Page({ params }: Props) {
  const { year } = await params;
  const yearNumber = parseInt(year, 10);

  if (isNaN(yearNumber) || yearNumber < 2019 || yearNumber > 2025) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">無効な年度です</p>
      </main>
    );
  }

  return <QuizPage year={yearNumber} />;
}
