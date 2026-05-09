import type { Timestamp } from "firebase/firestore";
import type { Question, LearningHistory, Bookmark, UserStats, ReportType } from "./types";

// Import question data from JSON files
import questions2019 from "@/data/questions/2019.json";
import questions2020 from "@/data/questions/2020.json";
import questions2021 from "@/data/questions/2021.json";
import questions2022 from "@/data/questions/2022.json";
import questions2023 from "@/data/questions/2023.json";
import questions2024 from "@/data/questions/2024.json";
import questions2025 from "@/data/questions/2025.json";

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

// Category mapping from JSON format to display format
const categoryMap: Record<string, string> = {
  money_lending_business_act: "法令",
  money_lending_business_act_registration: "法令",
  money_lending_business_act_supervisory_guidelines: "監督指針",
  money_lending_business_act_total_loan_regulation: "総量規制",
  money_lending_business_act_regulations: "業務",
  money_lending_business_act_manager: "主任者",
  interest_restriction_act: "関連法規",
  crime_proceeds_transfer_prevention_act: "関連法規",
  personal_information_protection_act: "関連法規",
  civil_code: "民法",
  default: "法令",
};

// Raw question type from JSON
interface RawQuestion {
  id: string;
  category: string;
  question: string;
  questionDetail?: string | null;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: string;
}

// Format text to add line breaks between a, b, c, d items
function formatAbcdText(text: string | null | undefined): string {
  if (!text) return "";
  
  // Add line breaks before fullwidth ａ, ｂ, ｃ, ｄ followed by space
  let formatted = text
    // Add newline before ｂ, ｃ, ｄ (not ａ since it's usually at the start)
    .replace(/\s(ｂ)\s/g, "\n\n$1 ")
    .replace(/\s(ｃ)\s/g, "\n\n$1 ")
    .replace(/\s(ｄ)\s/g, "\n\n$1 ")
    // Also handle cases without space before the letter (after punctuation)
    .replace(/([。、）」])(ｂ)\s/g, "$1\n\n$2 ")
    .replace(/([。、）」])(ｃ)\s/g, "$1\n\n$2 ")
    .replace(/([。、）」])(ｄ)\s/g, "$1\n\n$2 ")
    // Handle cases where ａ appears after a sentence ending
    .replace(/([。」])\s*(ａ)\s/g, "$1\n\n$2 ");
  
  return formatted;
}

// Convert raw question to Question type
function convertQuestion(raw: RawQuestion, year: number, index: number): Question {
  // Format both question and questionDetail to add line breaks for ａｂｃｄ
  const formattedQuestion = formatAbcdText(raw.question);
  const formattedDetail = formatAbcdText(raw.questionDetail);
  const fullQuestion = formattedDetail 
    ? `${formattedQuestion}\n\n${formattedDetail}` 
    : formattedQuestion;
    
  return {
    id: `${year}-${raw.id}`,
    year,
    questionNumber: index + 1,
    category: categoryMap[raw.category] || categoryMap.default,
    questionText: fullQuestion,
    choices: raw.options,
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
  };
}

// Load all questions from JSON files
const allQuestionsData: Record<number, RawQuestion[]> = {
  2019: questions2019 as RawQuestion[],
  2020: questions2020 as RawQuestion[],
  2021: questions2021 as RawQuestion[],
  2022: questions2022 as RawQuestion[],
  2023: questions2023 as RawQuestion[],
  2024: questions2024 as RawQuestion[],
  2025: questions2025 as RawQuestion[],
};

// Convert all questions
const ALL_QUESTIONS: Question[] = Object.entries(allQuestionsData).flatMap(
  ([year, questions]) => questions.map((q, i) => convertQuestion(q, parseInt(year), i))
);

// Demo storage for learning history and bookmarks
let demoLearningHistory: LearningHistory[] = [];
let demoBookmarks: Bookmark[] = [];

// Questions - Always load from JSON files (not Firestore)
export async function getQuestionsByYear(year: number): Promise<Question[]> {
  // Always return questions from JSON data
  return ALL_QUESTIONS.filter(q => q.year === year);
}

export async function getQuestionById(questionId: string): Promise<Question | null> {
  // Always return from JSON data
  return ALL_QUESTIONS.find(q => q.id === questionId) || null;
}

// Learning History
export async function saveLearningHistory(
  userId: string,
  data: Omit<LearningHistory, "id" | "answeredAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const id = `demo-history-${Date.now()}`;
    demoLearningHistory.push({
      id,
      ...data,
      answeredAt: new Date() as unknown as Timestamp,
    });
    return id;
  }

  const { collection, addDoc, Timestamp } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const docRef = await addDoc(
    collection(db, "users", userId, "learningHistory"),
    {
      ...data,
      answeredAt: Timestamp.now(),
    }
  );
  return docRef.id;
}

export async function getLearningHistory(
  userId: string,
  year?: number
): Promise<LearningHistory[]> {
  if (!isFirebaseConfigured()) {
    if (year) {
      return demoLearningHistory.filter(h => h.year === year);
    }
    return demoLearningHistory.slice(0, 100);
  }

  const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  let q;
  if (year) {
    q = query(
      collection(db, "users", userId, "learningHistory"),
      where("year", "==", year),
      orderBy("answeredAt", "desc")
    );
  } else {
    q = query(
      collection(db, "users", userId, "learningHistory"),
      orderBy("answeredAt", "desc"),
      limit(100)
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as LearningHistory));
}

export async function getTodayStats(userId: string): Promise<{ answered: number; correct: number }> {
  if (!isFirebaseConfigured()) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayHistory = demoLearningHistory.filter(h => {
      const answeredAt = h.answeredAt instanceof Date ? h.answeredAt : new Date();
      return answeredAt >= today;
    });
    const correct = todayHistory.filter(h => h.isCorrect).length;
    return { answered: todayHistory.length, correct };
  }

  const { collection, getDocs, query, where, Timestamp } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = Timestamp.fromDate(today);

  const q = query(
    collection(db, "users", userId, "learningHistory"),
    where("answeredAt", ">=", startOfDay)
  );
  const snapshot = await getDocs(q);
  
  let correct = 0;
  snapshot.docs.forEach((doc) => {
    if (doc.data().isCorrect) correct++;
  });

  return { answered: snapshot.size, correct };
}

// Bookmarks
export async function addBookmark(
  userId: string,
  data: Omit<Bookmark, "id" | "createdAt">
): Promise<string> {
  const bookmarkId = `${data.year}_${data.questionNumber}`;
  
  if (!isFirebaseConfigured()) {
    demoBookmarks.push({
      id: bookmarkId,
      ...data,
      createdAt: new Date() as unknown as Timestamp,
    });
    return bookmarkId;
  }

  const { doc, setDoc, Timestamp } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  await setDoc(doc(db, "users", userId, "bookmarks", bookmarkId), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return bookmarkId;
}

export async function removeBookmark(
  userId: string,
  year: number,
  questionNumber: number
): Promise<void> {
  const bookmarkId = `${year}_${questionNumber}`;
  
  if (!isFirebaseConfigured()) {
    demoBookmarks = demoBookmarks.filter(b => b.id !== bookmarkId);
    return;
  }

  const { doc, deleteDoc } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  await deleteDoc(doc(db, "users", userId, "bookmarks", bookmarkId));
}

export async function getBookmarks(userId: string): Promise<Bookmark[]> {
  if (!isFirebaseConfigured()) {
    return demoBookmarks;
  }

  const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const q = query(
    collection(db, "users", userId, "bookmarks"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Bookmark));
}

export async function isBookmarked(
  userId: string,
  year: number,
  questionNumber: number
): Promise<boolean> {
  const bookmarkId = `${year}_${questionNumber}`;
  
  if (!isFirebaseConfigured()) {
    return demoBookmarks.some(b => b.id === bookmarkId);
  }

  const { doc, getDoc } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const docRef = doc(db, "users", userId, "bookmarks", bookmarkId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

// User Stats
export async function getUserStats(userId: string): Promise<UserStats> {
  if (!isFirebaseConfigured()) {
    const todayStats = await getTodayStats(userId);
    const totalCorrect = demoLearningHistory.filter(h => h.isCorrect).length;
    return {
      totalAnswered: demoLearningHistory.length,
      totalCorrect,
      todayAnswered: todayStats.answered,
      todayCorrect: todayStats.correct,
      lastStudiedAt: null,
    };
  }

  const { collection, getDocs } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const historySnapshot = await getDocs(
    collection(db, "users", userId, "learningHistory")
  );
  
  const todayStats = await getTodayStats(userId);
  
  let totalCorrect = 0;
  historySnapshot.docs.forEach((doc) => {
    if (doc.data().isCorrect) totalCorrect++;
  });

  return {
    totalAnswered: historySnapshot.size,
    totalCorrect,
    todayAnswered: todayStats.answered,
    todayCorrect: todayStats.correct,
    lastStudiedAt: null,
  };
}

// Get available years with questions
export function getAvailableYears(): number[] {
  return [2025, 2024, 2023, 2022, 2021, 2020, 2019];
}

// Check if username is available
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    return true; // Demo mode always returns available
  }

  const { collection, getDocs, query, where } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const q = query(
    collection(db, "users"),
    where("username", "==", username.toLowerCase())
  );
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

// Find user by username
export async function findUserByUsername(username: string): Promise<{
  uid: string;
  email: string;
  birthYear: number;
  secretQuestion: string;
  secretAnswer: string;
} | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const { collection, getDocs, query, where } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const q = query(
    collection(db, "users"),
    where("username", "==", username.toLowerCase())
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    uid: doc.id,
    email: data.email,
    birthYear: data.birthYear,
    secretQuestion: data.secretQuestion,
    secretAnswer: data.secretAnswer,
  };
}

// Verify recovery answers
export async function verifyRecoveryAnswers(
  username: string,
  birthYear: number,
  secretAnswer: string
): Promise<{ success: boolean; email?: string }> {
  const user = await findUserByUsername(username);
  
  if (!user) {
    return { success: false };
  }
  
  if (user.birthYear === birthYear && 
      user.secretAnswer.toLowerCase() === secretAnswer.toLowerCase()) {
    return { success: true, email: user.email };
  }
  
  return { success: false };
}

// Get question count for a year
export function getQuestionCount(year: number): number {
  const questions = allQuestionsData[year];
  return questions ? questions.length : 0;
}

// Get incorrect questions for review
export async function getIncorrectQuestions(userId: string): Promise<{
  question: Question;
  incorrectCount: number;
  lastIncorrectAt: Date;
}[]> {
  if (!isFirebaseConfigured()) {
    // Get all incorrect answers from demo history
    const incorrectHistory = demoLearningHistory.filter(h => !h.isCorrect);
    
    // Group by questionId and count
    const incorrectMap = new Map<string, { count: number; lastAt: Date }>();
    incorrectHistory.forEach(h => {
      const existing = incorrectMap.get(h.questionId);
      const answeredAt = h.answeredAt instanceof Date ? h.answeredAt : new Date();
      if (existing) {
        existing.count++;
        if (answeredAt > existing.lastAt) {
          existing.lastAt = answeredAt;
        }
      } else {
        incorrectMap.set(h.questionId, { count: 1, lastAt: answeredAt });
      }
    });

    // Get questions and return with counts
    const result: { question: Question; incorrectCount: number; lastIncorrectAt: Date }[] = [];
    for (const [questionId, data] of incorrectMap.entries()) {
      const question = ALL_QUESTIONS.find(q => q.id === questionId);
      if (question) {
        result.push({
          question,
          incorrectCount: data.count,
          lastIncorrectAt: data.lastAt,
        });
      }
    }

    // Sort by incorrect count (descending)
    result.sort((a, b) => b.incorrectCount - a.incorrectCount);
    return result;
  }

  const { collection, getDocs, query, where } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  // Get all incorrect history
  const q = query(
    collection(db, "users", userId, "learningHistory"),
    where("isCorrect", "==", false)
  );
  const snapshot = await getDocs(q);
  
  // Group by questionId
  const incorrectMap = new Map<string, { count: number; lastAt: Date }>();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const questionId = data.questionId;
    const answeredAt = data.answeredAt?.toDate() || new Date();
    
    const existing = incorrectMap.get(questionId);
    if (existing) {
      existing.count++;
      if (answeredAt > existing.lastAt) {
        existing.lastAt = answeredAt;
      }
    } else {
      incorrectMap.set(questionId, { count: 1, lastAt: answeredAt });
    }
  });

  // Get questions
  const result: { question: Question; incorrectCount: number; lastIncorrectAt: Date }[] = [];
  for (const [questionId, data] of incorrectMap.entries()) {
    const question = await getQuestionById(questionId);
    if (question) {
      result.push({
        question,
        incorrectCount: data.count,
        lastIncorrectAt: data.lastAt,
      });
    }
  }

  result.sort((a, b) => b.incorrectCount - a.incorrectCount);
  return result;
}

// Submit a report
export async function submitReport(
  userId: string,
  data: {
    reportType: ReportType;
    year?: number;
    questionNumber?: number;
    comment: string;
  }
): Promise<string> {
  if (!isFirebaseConfigured()) {
    // Demo mode - just return fake ID
    return `demo-report-${Date.now()}`;
  }

  const { collection, addDoc, Timestamp } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  const docRef = await addDoc(collection(db, "reports"), {
    userId,
    reportType: data.reportType,
    year: data.year || null,
    questionNumber: data.questionNumber || null,
    comment: data.comment,
    createdAt: Timestamp.now(),
    status: "pending",
  });
  
  return docRef.id;
}

// Get all questions for a specific year (for report form dropdown)
export function getQuestionsForYear(year: number): { questionNumber: number; preview: string }[] {
  const questions = ALL_QUESTIONS.filter(q => q.year === year);
  return questions.map(q => ({
    questionNumber: q.questionNumber,
    preview: q.questionText.slice(0, 50) + (q.questionText.length > 50 ? "..." : ""),
  }));
}
