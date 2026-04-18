import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateExpenseInsights, askQuestion } from '@/lib/gemini';
import { buildMonthSummary, formatCurrency } from '@/lib/utils';
import { AIInsightCard } from '@/components/insights/AIInsightCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORY_COLORS } from '@/lib/utils';
import type { Expense, AIInsight, ExpenseCategory } from '@/types';

interface ChatMsg { role: 'user' | 'ai'; text: string }

export const InsightsPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [insight, setInsight]   = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [chat, setChat]         = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking]     = useState(false);
  const [showMonths, setShowMonths] = useState(false);

  const now = new Date();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (data) setExpenses(data as Expense[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const summary = buildMonthSummary(expenses, now.getFullYear(), now.getMonth());

  const refreshInsight = useCallback(async () => {
    if (expenses.length === 0) return;
    setAiLoading(true);
    const result = await generateExpenseInsights(summary);
    setInsight(result);
    setAiLoading(false);
  }, [expenses, summary]);

  useEffect(() => {
    if (!loading && expenses.length > 0 && !insight) refreshInsight();
  }, [loading, expenses.length]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    const q = question.trim();
    setChat(c => [...c, { role: 'user', text: q }]);
    setQuestion('');
    setAsking(true);
    const answer = await askQuestion(q, summary);
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
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
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
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                      labelStyle={{ color: 'var(--text-muted)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      formatter={(v: number) => [formatCurrency(v), 'Spent']}
                    />
                    <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category bar chart */}
            {catData.length > 0 && (
              <Card>
                <CardHeader><CardTitle>This Month by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                        labelFormatter={(_, p) => p[0]?.payload?.fullName ?? ''}
                        formatter={(v: number) => [formatCurrency(v), 'Spent']}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        labelStyle={{ color: 'var(--text-muted)' }}
                      />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={18}>
                        {catData.map((entry) => (
                          <rect key={entry.name} fill={CATEGORY_COLORS[entry.fullName as ExpenseCategory] ?? 'var(--accent)'} />
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
                        <div className={`max-w-[85%] px-3 py-2 rounded-[var(--radius-sm)] text-xs leading-relaxed ${
                          msg.role === 'user'
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
