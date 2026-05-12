import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateExpenseInsights, askQuestion } from '@/lib/gemini';
import { buildMonthSummary, buildRangeSummary, cn } from '@/lib/utils';
import { useCurrency } from '@/lib/CurrencyContext';
import { AIInsightCard } from '@/components/insights/AIInsightCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCategoryColor } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';


import type { Expense, AIInsight, ExpenseCategory } from '@/types';

interface ChatMsg { role: 'user' | 'ai'; text: string }

export const InsightsPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [range, setRange] = useState<1 | 6 | 12>(1);
  const { currency, formatAmount, getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();
  const now = new Date();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (data) setExpenses(data as Expense[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const summary = useMemo(() => {
    return range === 1 
      ? buildMonthSummary(expenses, now.getFullYear(), now.getMonth())
      : buildRangeSummary(expenses, range);
  }, [expenses, range]);

  const refreshInsight = useCallback(async () => {
    if (expenses.length === 0) return;
    setAiLoading(true);
    try {
      const result = await generateExpenseInsights(summary, currency);
      setInsight(result);
    } catch (err) {
      console.error('Failed to refresh insights:', err);
    } finally {
      setAiLoading(false);
    }
  }, [summary, currency, expenses.length]);

  useEffect(() => {
    if (loading || expenses.length === 0) return;
    
    const timer = setTimeout(() => {
      refreshInsight();
    }, 600); // Debounce AI calls by 600ms

    return () => clearTimeout(timer);
  }, [loading, expenses.length, range, refreshInsight]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    const q = question.trim();
    setChat(c => [...c, { role: 'user', text: q }]);
    setQuestion('');
    setAsking(true);
    const answer = await askQuestion(q, summary, currency);
    setChat(c => [...c, { role: 'ai', text: answer }]);
    setAsking(false);
  };

  // Build month-over-month bar data (last 6 months)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const s = buildMonthSummary(expenses, d.getFullYear(), d.getMonth());
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      amount: parseFloat(s.totalSpent.toFixed(2)),
    };
  });

  // Category bar data
  const catData = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({ name: name.split(' ')[0], fullName: name, amount: parseFloat(amount.toFixed(2)) }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
          <Sparkles size={16} className="text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Gemini-powered financial analysis</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[250px] w-full rounded-[var(--radius-lg)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Skeleton className="h-[200px] w-full rounded-[var(--radius-lg)]" />
             <Skeleton className="h-[200px] w-full rounded-[var(--radius-lg)]" />
          </div>
        </div>
      ) : (

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Monthly trend chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>6-Month Spending Trend</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowMonths(s => !s)}>
                    {showMonths ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      formatter={(value) => {
                        const num = Number(value ?? 0);
                        return [formatAmount(num), 'Spent'];
                      }}
                    />
                    <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category bar chart */}
            {catData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Spending by Category</CardTitle>
                    <div className="flex p-0.5 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
                      {( [1, 6, 12] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setRange(m)}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                            range === m 
                              ? "bg-[var(--accent)] text-white shadow-sm" 
                              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                          )}
                        >
                          {m === 1 ? '1M' : m === 6 ? '6M' : '1Y'}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                        labelFormatter={(_, p) => p[0]?.payload?.fullName ?? ''}
                        formatter={(value) => {
                          const num = Number(value ?? 0);
                          return [formatAmount(num), 'Spent'];
                        }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        labelStyle={{ color: 'var(--text-muted)' }}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={18}>
                        {catData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getCategoryColor(entry.fullName)} 
                          />
                        ))}
                      </Bar>

                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* AI Q&A Chat */}
            <Card>
              <CardHeader>
                <CardTitle>Ask AI About Your Spending</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {/* Chat history */}
                {chat.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {chat.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] px-3 py-2 rounded-[var(--radius-sm)] text-xs leading-relaxed ${msg.role === 'user'
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]'
                          }`}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                    {asking && (
                      <div className="flex justify-start">
                        <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                          <Spinner size="sm" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Input */}
                <form onSubmit={handleAsk} className="flex gap-2">
                  <input
                    className="flex-1 h-10 px-3 rounded-[var(--radius-sm)] text-sm"
                    placeholder="e.g. How much did I spend on food?"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    disabled={asking}
                  />
                  <Button type="submit" size="icon" loading={asking} disabled={!question.trim()}>
                    <Send size={14} />
                  </Button>
                </form>
                {chat.length === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      'What is my biggest expense category?',
                      'How can I save more this month?',
                      'Am I overspending on dining?',
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => setQuestion(q)}
                        className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — AI Insight Card */}
          <div>
            <AIInsightCard insight={insight} loading={aiLoading} onRefresh={refreshInsight} />
          </div>
        </div>
      )}
    </div>
  );
};
