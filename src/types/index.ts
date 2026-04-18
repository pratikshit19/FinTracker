export type ExpenseCategory =
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Healthcare'
  | 'Housing'
  | 'Utilities'
  | 'Education'
  | 'Travel'
  | 'Other';

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO date string YYYY-MM-DD
  notes?: string;
  created_at: string;
}

export interface ExpenseInsert {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
}

export interface MonthSummary {
  totalSpent: number;
  topCategory: string;
  transactionCount: number;
  avgPerDay: number;
  categoryBreakdown: Record<string, number>;
  dailySpend: { date: string; amount: number }[];
}

export interface AIInsight {
  summary: string;
  score: number;
  recommendations: string[];
  anomalies: string[];
  topCategory: string;
}

export type AuthMode = 'login' | 'signup';
