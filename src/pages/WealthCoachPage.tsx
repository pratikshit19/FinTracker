import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, TrendingUp, HelpCircle, Send, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';
import { generateWealthCoachAdvice, askWealthCoach, type WealthAdvice } from '@/lib/gemini';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChatMsg {
  role: 'user' | 'coach';
  text: string;
}

export const WealthCoachPage = () => {
  const { currency, formatAmount, getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();

  // Financial parameters
  const [sipAmount, setSipAmount] = useState<number>(10000);
  const [returnRate, setReturnRate] = useState<number>(12);
  const [stepUpRate, setStepUpRate] = useState<number>(10);
  const [targetYears, setTargetYears] = useState<number>(10);

  // User and profile state
  const [monthlyIncome, setMonthlyIncome] = useState<number>(50000);
  const [detectedSips, setDetectedSips] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Coach state
  const [advice, setAdvice] = useState<WealthAdvice | null>(null);
  const [coachLoading, setCoachLoading] = useState<boolean>(false);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState<string>('');
  const [asking, setAsking] = useState<boolean>(false);

  // Fetch initial profile & active SIP subscriptions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // 1. Fetch profile monthly income
          const { data: profile } = await supabase
            .from('profiles')
            .select('monthly_income')
            .eq('id', user.id)
            .single();
          if (profile && profile.monthly_income) {
            setMonthlyIncome(Number(profile.monthly_income));
          }

          // 2. Fetch active SIP subscriptions
          const { data: sips } = await supabase
            .from('subscriptions')
            .select('name, amount')
            .eq('user_id', user.id)
            .eq('category', 'Investment/SIP')
            .eq('status', 'active');

          if (sips && sips.length > 0) {
            const formatted = sips.map(s => ({ name: s.name, amount: Number(s.amount) }));
            setDetectedSips(formatted);
            const total = formatted.reduce((acc, curr) => acc + curr.amount, 0);
            if (total > 0) {
              setSipAmount(total);
            }
          }
        }
      } catch (err) {
        console.error('[WealthCoach] Failed to fetch layout data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch coach advice based on parameters
  const refreshCoachAdvice = useCallback(async () => {
    setCoachLoading(true);
    try {
      const result = await generateWealthCoachAdvice(monthlyIncome, detectedSips, sipAmount, currency);
      setAdvice(result);
    } catch (err) {
      console.error('[WealthCoach] Failed to load coaching advice', err);
    } finally {
      setCoachLoading(false);
    }
  }, [monthlyIncome, detectedSips, sipAmount, currency]);

  // Load advice once loading finishes
  useEffect(() => {
    if (!loading) {
      refreshCoachAdvice();
    }
  }, [loading, sipAmount, refreshCoachAdvice]);

  // Compounding math helper
  const projections = useMemo(() => {
    const calc = (years: number) => {
      const monthlyRate = (returnRate / 100) / 12;
      let totalInvested = 0;
      let totalWealth = 0;
      let currentSip = sipAmount;
      const data = [];

      for (let y = 1; y <= years; y++) {
        for (let m = 1; m <= 12; m++) {
          totalInvested += currentSip;
          totalWealth = (totalWealth + currentSip) * (1 + monthlyRate);
        }
        data.push({
          year: `Yr ${y}`,
          Invested: Math.round(totalInvested),
          Wealth: Math.round(totalWealth),
        });
        // Step up SIP for next year
        currentSip = currentSip * (1 + stepUpRate / 100);
      }

      return {
        totalInvested: Math.round(totalInvested),
        totalWealth: Math.round(totalWealth),
        estReturns: Math.round(Math.max(0, totalWealth - totalInvested)),
        chartData: data,
      };
    };

    const targetProj = calc(targetYears);
    const fiveYearProj = calc(5);
    const tenYearProj = calc(10);

    return {
      target: targetProj,
      five: fiveYearProj,
      ten: tenYearProj,
    };
  }, [sipAmount, returnRate, stepUpRate, targetYears]);

  // Handle asking custom questions
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    const q = question.trim();
    setChat(c => [...c, { role: 'user', text: q }]);
    setQuestion('');
    setAsking(true);

    try {
      const answer = await askWealthCoach(q, chat, monthlyIncome, detectedSips, sipAmount, currency);
      setChat(c => [...c, { role: 'coach', text: answer }]);
    } catch (err) {
      console.error(err);
      setChat(c => [...c, { role: 'coach', text: 'Sorry, I hit an unexpected block. Let’s try that again.' }]);
    } finally {
      setAsking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-[var(--text-muted)]">Building Wealth Strategy…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
            <Coins size={16} className="text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Wealth Coach & Planner</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Minimal, local-first exponential growth projections</p>
          </div>
        </div>
        {advice?.isLocal && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full text-[10px] font-bold text-[var(--text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            Local Guidance Engine
          </div>
        )}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projections & Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Sliders Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Compound Planner Config
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Monthly Contribution */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span>MONTHLY SIP CONTRIBUTION</span>
                  <span className="text-[var(--accent)]">{formatAmount(sipAmount)}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={1000}
                  value={sipAmount}
                  onChange={(e) => setSipAmount(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-[var(--border)] rounded-lg appearance-none"
                />
                {detectedSips.length > 0 && (
                  <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Prefilled from your {detectedSips.length} active SIP subscription(s).
                  </span>
                )}
              </div>

              {/* Expected Returns */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span>EXPECTED RETURN RATE (ANNUAL)</span>
                  <span className="text-[var(--accent)]">{returnRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={0.5}
                  value={returnRate}
                  onChange={(e) => setReturnRate(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-[var(--border)] rounded-lg appearance-none"
                />
              </div>

              {/* Annual Step-Up */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span>ANNUAL SIP STEP-UP</span>
                  <span className="text-[var(--accent)]">{stepUpRate}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={stepUpRate}
                  onChange={(e) => setStepUpRate(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-[var(--border)] rounded-lg appearance-none"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Increasing investments each year delivers massive compounding.
                </span>
              </div>

              {/* Time Horizon */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span>TARGET TIME HORIZON</span>
                  <span className="text-[var(--accent)]">{targetYears} Years</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={30}
                  step={1}
                  value={targetYears}
                  onChange={(e) => setTargetYears(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-1.5 bg-[var(--border)] rounded-lg appearance-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Milestones Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 5 Year projection */}
            <Card className="relative overflow-hidden bg-[var(--bg-elevated)]/30 border-[var(--border)]">
              <div className="absolute top-3 right-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                5 Years
              </div>
              <CardContent className="pt-5 pb-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Invested</p>
                <h3 className="text-base font-semibold mt-0.5">{formatAmount(projections.five.totalInvested)}</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-3.5">Future Wealth</p>
                <h3 className="text-xl font-bold text-[var(--success)] mt-0.5 flex items-center gap-1">
                  {formatAmount(projections.five.totalWealth)}
                </h3>
              </CardContent>
            </Card>

            {/* 10 Year projection */}
            <Card className="relative overflow-hidden bg-[var(--bg-elevated)]/30 border-[var(--border)]">
              <div className="absolute top-3 right-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                10 Years
              </div>
              <CardContent className="pt-5 pb-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Invested</p>
                <h3 className="text-base font-semibold mt-0.5">{formatAmount(projections.ten.totalInvested)}</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-3.5">Future Wealth</p>
                <h3 className="text-xl font-bold text-[var(--success)] mt-0.5">
                  {formatAmount(projections.ten.totalWealth)}
                </h3>
              </CardContent>
            </Card>

            {/* Target projection */}
            <Card className="relative overflow-hidden bg-[var(--bg-elevated)]/50 border-[var(--accent)]/30 shadow-[var(--shadow-lg)]">
              <div className="absolute top-3 right-3 text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                {targetYears} Years
              </div>
              <CardContent className="pt-5 pb-4">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Invested</p>
                <h3 className="text-base font-semibold mt-0.5">{formatAmount(projections.target.totalInvested)}</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-3.5">Future Wealth</p>
                <h3 className="text-2xl font-black text-[var(--success)] mt-0.5 tracking-tight flex items-baseline gap-1">
                  {formatAmount(projections.target.totalWealth)}
                  <ArrowUpRight size={14} className="text-[var(--success)] opacity-80" />
                </h3>
              </CardContent>
            </Card>
          </div>

          {/* Exponential Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[var(--text-secondary)]">
                Wealth Compounding Curve ({targetYears} Years Horizon)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={projections.target.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${symbol}${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      labelStyle={{ color: 'var(--text-muted)', fontWeight: 'bold' }}
                      itemStyle={{ padding: '2px 0' }}
                      formatter={(value) => [formatAmount(Number(value)), '']}
                    />
                    <Area
                      type="monotone"
                      name="Accumulated Wealth"
                      dataKey="Wealth"
                      stroke="var(--success)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorWealth)"
                    />
                    <Area
                      type="monotone"
                      name="Amount Invested"
                      dataKey="Invested"
                      stroke="var(--accent)"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#colorInvested)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Coach Q&A Box */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Brainstorm with Coach
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Chat timeline */}
              {chat.length > 0 && (
                <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {chat.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90%] px-3 py-2 rounded-[var(--radius-sm)] text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]'
                        }`}
                      >
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

              {/* Action Form */}
              <form onSubmit={handleAsk} className="flex gap-2">
                <input
                  className="flex-1 h-9 px-3 rounded-[var(--radius-sm)] text-xs"
                  placeholder="Ask Coach, e.g. Ideas for 5 hours/week?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={asking}
                />
                <Button type="submit" size="icon" className="h-9 w-9 shrink-0" loading={asking} disabled={!question.trim()}>
                  <Send size={12} />
                </Button>
              </form>

              {/* Help Prompts */}
              {chat.length === 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">RECOMMENDED QUESTIONS</span>
                  <div className="flex flex-col gap-1">
                    {[
                      'How can I double my income with side gigs?',
                      'Explain how the 10% step-up SIP compounds.',
                      'What is a simple emergency shield rule?',
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuestion(q)}
                        className="text-left text-xs px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)] transition-all flex items-center justify-between"
                      >
                        <span className="truncate">{q}</span>
                        <HelpCircle size={10} className="shrink-0 text-[var(--text-muted)]/80 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Coach Guidance & Chat */}
        <div className="flex flex-col gap-6">
          {/* Advice Card */}
          <Card className="relative overflow-hidden bg-[var(--bg-surface)]">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent)]" />
                Coach's Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              {coachLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <Spinner size="md" />
                  <p className="text-xs text-[var(--text-muted)]">Refining financial tactics…</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {/* Summary */}
                  <p className="font-medium text-[var(--text-primary)]">
                    {advice?.summary}
                  </p>

                  <div className="h-px bg-[var(--border)] my-1" />

                  {/* Side Hustles */}
                  <div>
                    <h4 className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
                      Ways to Make Money Today
                    </h4>
                    <div className="flex flex-col gap-2.5">
                      {advice?.incomeStrategies.map((strategy, i) => (
                        <div key={i} className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)]/40 border border-[var(--border)]">
                          {strategy}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-[var(--border)] my-1" />

                  {/* Wealth steps */}
                  <div>
                    <h4 className="text-[10px] font-bold text-[var(--success)] uppercase tracking-wider mb-2">
                      Wealth Accelerator Rules
                    </h4>
                    <ul className="list-none flex flex-col gap-2 p-0 m-0">
                      {advice?.wealthSteps.map((step, i) => (
                        <li key={i} className="flex gap-2 items-start">
                          <span className="text-[var(--success)] select-none">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weekly Challenge */}
                  {advice?.challenge && (
                    <div className="mt-2 p-3 rounded-[var(--radius-sm)] bg-[var(--accent-subtle)] border border-[var(--accent)]/15">
                      <h4 className="text-[9px] font-extrabold text-[var(--accent)] uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <TrendingUp size={10} />
                        WEEKLY WEALTH CHALLENGE
                      </h4>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {advice.challenge}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
