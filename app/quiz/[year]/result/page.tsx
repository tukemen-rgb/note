import { Suspense } from "react";
import { ResultPage } from "@/components/quiz-page/result-page";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  params: Promise<{ year: string }>;
}

function ResultPageWrapper({ year }: { year: number }) {
  return <ResultPage year={year} />;
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

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <Spinner className="h-8 w-8 text-accent" />
        </main>
      }
    >
      <ResultPageWrapper year={yearNumber} />
    </Suspense>
  );
}
