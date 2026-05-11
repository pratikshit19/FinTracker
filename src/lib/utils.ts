import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import type { Expense, ExpenseCategory, MonthSummary } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency, 
    minimumFractionDigits: 2 
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Food & Dining':    '#f59e0b',
  'Transportation':   '#6366f1',
  'Shopping':         '#ec4899',
  'Entertainment':    '#8b5cf6',
  'Healthcare':       '#22c55e',
  'Housing':          '#3b82f6',
  'Utilities':        '#14b8a6',
  'Education':        '#f97316',
  'Travel':           '#06b6d4',
  'Other':            '#6b7280',
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  'Food & Dining':    '🍽️',
  'Transportation':   '🚗',
  'Shopping':         '🛍️',
  'Entertainment':    '🎬',
  'Healthcare':       '💊',
  'Housing':          '🏠',
  'Utilities':        '⚡',
  'Education':        '📚',
  'Travel':           '✈️',
  'Other':            '📦',
};

export const ALL_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Healthcare', 'Housing', 'Utilities', 'Education', 'Travel', 'Other',
];

export function buildRangeSummary(expenses: Expense[], months: number): MonthSummary {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const startDateStr = startDate.toISOString().split('T')[0];

  const filtered = expenses.filter(e => e.date >= startDateStr);

  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);
  const transactionCount = filtered.length;

  const categoryBreakdown: Record<string, number> = {};
  for (const e of filtered) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] ?? 0) + e.amount;
  }

  const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None';
  const avgPerDay = totalSpent / (months * 30); // Rough approximation

  const dailyMap: Record<string, number> = {};
  for (const e of filtered) {
    dailyMap[e.date] = (dailyMap[e.date] ?? 0) + e.amount;
  }
  const dailySpend = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date: formatDateShort(date), amount }));

  return { totalSpent, transactionCount, avgPerDay, topCategory, categoryBreakdown, dailySpend, monthlyIncome: 0 };
}

export function buildMonthSummary(expenses: Expense[], year: number, month: number): MonthSummary {
  const filtered = expenses.filter(e => {
    const d = parseISO(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalSpent = filtered.reduce((s, e) => s + e.amount, 0);
  const transactionCount = filtered.length;

  const categoryBreakdown: Record<string, number> = {};
  for (const e of filtered) {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] ?? 0) + e.amount;
  }

  const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None';
  const days = getDaysInMonth(year, month);
  const avgPerDay = transactionCount > 0 ? totalSpent / days : 0;

  // Build daily spend map
  const dailyMap: Record<string, number> = {};
  for (const e of filtered) {
    dailyMap[e.date] = (dailyMap[e.date] ?? 0) + e.amount;
  }
  const dailySpend = Object.entries(dailyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date: formatDateShort(date), amount }));

  return { totalSpent, transactionCount, avgPerDay, topCategory, categoryBreakdown, dailySpend, monthlyIncome: 0 };
}
