import type { Timestamp } from "firebase/firestore";

export interface Question {
  id: string;
  year: number;
  questionNumber: number;
  category: string;
  questionText: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
}

export interface LearningHistory {
  id: string;
  questionId: string;
  year: number;
  questionNumber: number;
  isCorrect: boolean;
  selectedAnswer: number;
  answeredAt: Timestamp;
}

export interface Bookmark {
  id: string;
  questionId: string;
  year: number;
  questionNumber: number;
  createdAt: Timestamp;
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  todayAnswered: number;
  todayCorrect: number;
  lastStudiedAt: Timestamp | null;
}

export const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019] as const;

export const CATEGORIES = [
  "法及び関係法令に関すること",
  "貸付け及び貸付けに付随する取引に関する法令及び実務に関すること",
  "資金需要者等の保護に関すること",
  "財務及び会計に関すること",
] as const;

export type ReportType = 
  | "question_error"   // 問題・回答に誤りがある
  | "system_error"     // システムが動かない
  | "data_lost"        // データが消えた
  | "other";           // その他

export interface Report {
  id: string;
  userId: string;
  reportType: ReportType;
  year?: number;
  questionNumber?: number;
  comment: string;
  createdAt: Timestamp;
  status: "pending" | "resolved";
}
