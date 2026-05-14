import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import {
  Target, Wallet, Plus, AlertCircle,
  ArrowRight, ShieldCheck, TrendingDown, TrendingUp, DollarSign, Trash2, Edit3, Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency, CURRENCIES } from '@/lib/CurrencyContext';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/Dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/Select';
import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { GoalCard } from '@/components/dashboard/GoalCard';
import {
  ESSENTIAL_CATEGORIES, DISCRETIONARY_CATEGORIES,
  buildMonthSummary, cn, getAvailableCategories
} from '@/lib/utils';
import { FinancialAdvisor } from '@/components/dashboard/FinancialAdvisor';

import type { Budget, Goal, Expense, ExpenseCategory } from '@/types';

type TabType = 'budgets' | 'goals';

type BillingCycle = 'weekly' | 'monthly' | 'yearly';

type Subscription = {
  id: string;
  name: string;
  amount: number;
  billing_cycle: BillingCycle;
  status: 'active' | 'cancelled' | 'paused';
  next_billing: string;
};

export const BudgetsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('budgets');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currency, formatAmount } = useCurrency();

  // Modal States
  const [budgetModal, setBudgetModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [plannedSavingsModal, setPlannedSavingsModal] = useState(false);
  const [newTotalSavings, setNewTotalSavings] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form States
  const [budgetCategory, setBudgetCategory] = useState<ExpenseCategory | ''>('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalContribution, setGoalContribution] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Custom Category State for Budgets
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [hasConfirmedSavings, setHasConfirmedSavings] = useState(false);

  // Target Surplus State
  const [targetSurplus, setTargetSurplus] = useState(2000);
  const [isSurplusModalOpen, setIsSurplusModalOpen] = useState(false);
  const [newSurplusValue, setNewSurplusValue] = useState('2000');


  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [budgetsRes, goalsRes, expensesRes, subscriptionsRes, profileRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('monthly_income').eq('id', user.id).single(),
    ]);

    if (budgetsRes.data) setBudgets(budgetsRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    if (expensesRes.data) setExpenses(expensesRes.data);
    if (subscriptionsRes.data) setSubscriptions(subscriptionsRes.data as Subscription[]);
    if (profileRes.data) setMonthlyIncome(profileRes.data.monthly_income || 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategory || !budgetLimit) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // For weights, we'll store 1 (Economy), 2 (Standard), or 3 (Priority) in the monthly_limit field
      const weightValue = parseFloat(budgetLimit);
      const { error } = await supabase.from('budgets').upsert({
        id: editingBudgetId || undefined,
        user_id: user.id,
        category: isCustomCategory ? customCategoryName.trim() : budgetCategory,
        monthly_limit: weightValue
      }, { onConflict: 'user_id,category' });


      if (!error) {
        await fetchData();
        setBudgetModal(false);
        setBudgetCategory('');
        setBudgetLimit('');
        setEditingBudgetId(null);
        setIsCustomCategory(false);
        setCustomCategoryName('');
      }

    }
    setSubmitting(false);
  };

  const handleEditBudget = (budget: Budget) => {
    setBudgetCategory(budget.category);
    setBudgetLimit(budget.monthly_limit.toString());
    setEditingBudgetId(budget.id);
    setBudgetModal(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (!error) {
      await fetchData();
      setBudgetModal(false);
      setEditingBudgetId(null);
    }
  };

  const handlePayBill = async (bill: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    // 1. Add as expense
    await supabase.from('expenses').insert({
      user_id: user.id,
      title: `Bill: ${bill.name}`,
      amount: bill.amount,
      category: 'Utilities',
      date: new Date().toISOString().split('T')[0]
    });

    // 2. Update next billing date
    const nextDate = new Date(bill.next_billing || bill.date);
    if (bill.billing_cycle === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (bill.billing_cycle === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    else nextDate.setMonth(nextDate.getMonth() + 1);

    await supabase.from('subscriptions').update({
      next_billing: nextDate.toISOString().split('T')[0]
    }).eq('id', bill.id);

    await fetchData();
    setLoading(false);
  };

  const handleUpdateTotalSavings = async () => {
    const total = parseFloat(newTotalSavings);
    if (isNaN(total) || total <= 0 || goals.length === 0) return;

    setSubmitting(true);
    const currentTotal = goals.reduce((s, g) => s + (g.monthly_contribution || 0), 0);

    // Distribute proportionally
    const updates = goals.map(g => {
      const currentCont = g.monthly_contribution || 0;
      const ratio = currentTotal > 0 ? currentCont / currentTotal : 1 / goals.length;
      return supabase.from('goals').update({ monthly_contribution: total * ratio }).eq('id', g.id);
    });

    await Promise.all(updates);
    await fetchData();
    setPlannedSavingsModal(false);
    setSubmitting(false);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTarget) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const goalData = {
        user_id: user.id,
        name: goalName,
        target_amount: Math.max(0.01, parseFloat(goalTarget)),
        current_amount: Math.max(0, parseFloat(goalCurrent || '0')),
        monthly_contribution: Math.max(0, parseFloat(goalContribution || '0')),
        deadline: goalDeadline && goalDeadline.trim() !== '' ? goalDeadline : null
      };

      const { error } = editingGoalId
        ? await supabase.from('goals').update(goalData).eq('id', editingGoalId)
        : await supabase.from('goals').insert(goalData);

      if (error) {
        console.error('Goal Error:', error);
        alert(`Error: ${error.message}`);
      }

      if (!error) {
        await fetchData();
        setGoalModal(false);
        setEditingGoalId(null);
        setGoalName('');
        setGoalTarget('');
        setGoalCurrent('');
        setGoalContribution('');
        setGoalDeadline('');

        // Trigger Celebration
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1b48db', '#22c55e', '#f59e0b', '#ffffff']
        });
      }
    }
    setSubmitting(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalName(goal.name);
    setGoalTarget(goal.target_amount.toString());
    setGoalCurrent((goal.current_amount || 0).toString());
    setGoalContribution((goal.monthly_contribution || 0).toString());
    setGoalDeadline(goal.deadline || '');
    setEditingGoalId(goal.id);
    setGoalModal(true);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    await supabase.from('goals').delete().eq('id', id);
    fetchData();
  };

  const now = new Date();
  const dayOfMonth = now.getDate();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Intuitive days remaining: 31 - 14 = 17. 
  // If it's late at night (like 11:40 PM), including today as a full spending day feels wrong.
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth);
  const monthProgress = dayOfMonth / daysInMonth;

  const summary = buildMonthSummary(expenses, now.getFullYear(), now.getMonth());
  const fixedExpenses = subscriptions.reduce((sum, sub) => {
    if (sub.billing_cycle === 'monthly') return sum + sub.amount;
    if (sub.billing_cycle === 'yearly') return sum + sub.amount / 12;
    if (sub.billing_cycle === 'weekly') return sum + sub.amount * 4.33;
    return sum;
  }, 0);

  const personalBudgetBuffer = monthlyIncome - fixedExpenses - summary.totalSpent;
  const totalPlannedSavings = goals.reduce((s, g) => s + (g.monthly_contribution || 0), 0);
  const totalBuffer = monthlyIncome - fixedExpenses - summary.totalSpent;

  // 1. First, take out the Savings Goal
  const bufferAfterSavings = Math.max(0, totalBuffer - totalPlannedSavings);

  // 2. Then, take out the Target Surplus (Leftover cash)
  const finalSpendableCapacity = Math.max(0, bufferAfterSavings - targetSurplus);

  // Smart Capacity logic
  const totalWeight = budgets.reduce((s, b) => s + (b.monthly_limit || 1), 0);
  const budgetCapacity = finalSpendableCapacity;

  const smartBudgets = budgets.map(b => {
    const weight = b.monthly_limit || 1;
    const proportionalLimit = totalWeight > 0 ? (weight / totalWeight) * budgetCapacity : 0;

    // Strict Ceiling Logic: Economy (5%), Standard (10%), Priority (15%) of income
    const ceilingPercent = weight === 1 ? 0.05 : weight === 2 ? 0.10 : 0.15;
    const strictCeiling = monthlyIncome * ceilingPercent;

    return {
      ...b,
      dynamic_limit: Math.min(proportionalLimit, strictCeiling)
    };
  });

  const remainingBudgetAllowed = smartBudgets.reduce((sum, b) => {
    const spentInCategory = summary.categoryBreakdown[b.category] || 0;
    return sum + Math.max(0, b.dynamic_limit - spentInCategory);
  }, 0);

  const dailySafeSpend = Math.max(0, finalSpendableCapacity / daysRemaining);
  const budgetGap = Math.max(0, remainingBudgetAllowed - budgetCapacity);

  // Accrued Savings Logic:
  // How much were you allowed to spend until TODAY?
  // (Total Budget Capacity / Total Days) * Days already passed
  const totalMonthlyBudget = budgetCapacity + summary.totalSpent; // Estimate of full month pool
  const dailyAllowance = totalMonthlyBudget / daysInMonth;
  const allowedToDate = dailyAllowance * dayOfMonth;
  const savingsToDate = Math.max(0, allowedToDate - summary.totalSpent);

  // Your projected leftover is your target ₹2,000 + whatever you've "saved" by being under budget
  const dynamicSurplusProjection = targetSurplus + savingsToDate;

  // Pace Calculation
  const actualDailyAvg = summary.totalSpent / dayOfMonth;
  const isOverpacing = actualDailyAvg > dailySafeSpend && summary.totalSpent > 0;

  const upcomingBills = subscriptions.filter(s => {
    if (!s.next_billing) return false;
    const nextDate = new Date(s.next_billing);
    const now = new Date();
    return (nextDate.getMonth() === now.getMonth() && nextDate.getFullYear() === now.getFullYear()) || nextDate < now;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Budgets & Goals</h1>
        <p className="text-sm text-[var(--text-muted)]">Organize your spending and plan for your future</p>
      </div>

      {/* Modern Tabs Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
        <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('budgets')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
              activeTab === 'budgets'
                ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <Wallet size={16} />
            Budgets
            <Badge variant={activeTab === 'budgets' ? 'default' : 'muted'} className="ml-1 scale-90">
              {budgets.length}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
              activeTab === 'goals'
                ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <Target size={16} />
            Goals
            <Badge variant={activeTab === 'goals' ? 'default' : 'muted'} className="ml-1 scale-90">
              {goals.length}
            </Badge>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === 'budgets' ? (
            <Button className="w-full sm:w-auto gap-2" onClick={() => { setEditingBudgetId(null); setBudgetCategory(''); setBudgetLimit(''); setBudgetModal(true); }}>
              <Plus size={16} /> New Budget
            </Button>
          ) : (
            <Button className="w-full sm:w-auto gap-2" onClick={() => { setEditingGoalId(null); setGoalName(''); setGoalTarget(''); setGoalCurrent(''); setGoalContribution(''); setGoalDeadline(''); setGoalModal(true); }}>
              <Plus size={16} /> New Saving Goal
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'budgets' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'budgets' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {activeTab === 'budgets' ? (
              <div className="flex flex-col gap-6">
                {/* Budget Header Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white border-none overflow-hidden relative">
                    <CardContent className="pt-6 relative z-10">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Free Spendable Capacity</p>
                      <div className="text-3xl font-bold">
                        {formatAmount(finalSpendableCapacity)}
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
                        <ShieldCheck size={14} />
                        After {formatAmount(totalPlannedSavings)} savings & {formatAmount(targetSurplus)} leftover
                      </div>
                    </CardContent>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
                  </Card>

                  <Card className={cn(
                    "bg-[var(--bg-surface)] border-[var(--border)]",
                    dailySafeSpend < 200 ? "border-[var(--warning)]/50 bg-[var(--warning-subtle)]/5" : ""
                  )}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Daily Safe Spend
                        </p>
                        <Badge variant={isOverpacing ? 'warning' : 'success'} className="text-[7px] h-3.5 px-1 font-black">
                          {isOverpacing ? 'FAST PACE' : 'IDEAL PACE'}
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className={cn(
                          "text-3xl font-bold",
                          dailySafeSpend < 200 || isOverpacing ? "text-[var(--warning)]" : "text-[var(--text-primary)]"
                        )}>
                          {formatAmount(dailySafeSpend)}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">/ day</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-4">
                        <Activity size={14} className={isOverpacing ? "text-[var(--warning)]" : "text-[var(--success)]"} />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {daysRemaining} days left in {now.toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={cn(
                    "bg-[var(--bg-surface)] border-[var(--border)] group",
                    dynamicSurplusProjection < targetSurplus ? "border-[var(--danger)]/50 bg-[var(--danger-subtle)]/5" : ""
                  )}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Cushion Projection</p>
                        <button
                          onClick={() => {
                            setNewSurplusValue(targetSurplus.toString());
                            setIsSurplusModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                      <div className={cn(
                        "text-3xl font-bold",
                        dynamicSurplusProjection < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"
                      )}>
                        {formatAmount(dynamicSurplusProjection)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-4">
                        <TrendingDown size={14} className={dynamicSurplusProjection < targetSurplus ? "text-[var(--warning)]" : "text-[var(--success)]"} />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {dynamicSurplusProjection >= targetSurplus
                            ? "Exceeding target cushion!"
                            : `Aiming for ${formatAmount(targetSurplus)} leftover`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>


                {/* Financial Advisor Insights */}
                <FinancialAdvisor
                  income={monthlyIncome}
                  fixedExpenses={fixedExpenses}
                  totalSpent={summary.totalSpent}
                  budgets={budgets}
                  goals={goals}
                  upcomingBills={upcomingBills}
                  categorySpent={summary.categoryBreakdown}
                  onPayBill={handlePayBill}
                />

                {/* Budget Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {smartBudgets.map((b, i) => (
                    <BudgetCard
                      key={b.id}
                      category={b.category}
                      limit={b.dynamic_limit}
                      spent={summary.categoryBreakdown[b.category] || 0}
                      index={i}
                      onEdit={() => handleEditBudget(b)}
                    />
                  ))}
                  {budgets.length === 0 && (
                    <div className="md:col-span-2 bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-2xl p-16 text-center">
                      <div className="h-16 w-16 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)]">
                        <Wallet size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">No budgets set yet</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                        Control your spending by setting monthly limits for your expense categories.
                      </p>
                      <Button variant="outline" className="mt-8 border-dashed" onClick={() => setBudgetModal(true)}>
                        <Plus size={16} className="mr-2" /> Add Your First Budget
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Goals Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-[var(--success)] to-[var(--success-hover)] text-white border-none overflow-hidden relative">
                    <CardContent className="pt-6 relative z-10">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Amount Saved</p>
                      <div className="text-3xl font-bold">
                        {formatAmount(goals.reduce((s, g) => s + (g.current_amount || 0), 0))}
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
                        <ShieldCheck size={14} />
                        Across {goals.length} active goals
                      </div>
                    </CardContent>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
                  </Card>

                  <Card className="bg-[var(--bg-surface)] border-[var(--border)] group relative overflow-hidden">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Monthly Goal Progress</p>
                        <button
                          onClick={() => {
                            setNewTotalSavings(goals.reduce((s, g) => s + (g.monthly_contribution || 0), 0).toString());
                            setPlannedSavingsModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        {formatAmount(goals.reduce((s, g) => s + (g.monthly_contribution || 0), 0))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-4">
                        <TrendingDown size={14} className="text-[var(--accent)]" />
                        <span className="text-sm text-[var(--text-secondary)]">Total planned monthly savings</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Success Hub */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-[var(--bg-surface)] border-[var(--border)] overflow-hidden relative group">
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
                            <Activity size={18} />
                          </div>
                          <h3 className="text-sm font-bold text-[var(--text-primary)] text-left">Did I save successfully?</h3>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          dynamicSurplusProjection >= targetSurplus 
                            ? "bg-[var(--success-subtle)] text-[var(--success)]" 
                            : "bg-[var(--warning-subtle)] text-[var(--warning)]"
                        )}>
                          {dynamicSurplusProjection >= targetSurplus ? "Exceeding Plan" : "In Progress"}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {!hasConfirmedSavings ? (
                          <div className="flex flex-col gap-3">
                            <p className="text-xs text-[var(--text-muted)] text-left">
                              The numbers say you're on track. Have you officially moved your savings to your vault?
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1 bg-[var(--success)] hover:bg-[var(--success-hover)] text-white"
                                onClick={() => {
                                  setHasConfirmedSavings(true);
                                  confetti({
                                    particleCount: 150,
                                    spread: 70,
                                    origin: { y: 0.6 },
                                    colors: ['#10b981', '#3b82f6', '#f59e0b']
                                  });
                                }}
                              >
                                Yes, I've Saved!
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-[var(--border)] text-[var(--text-muted)]"
                                onClick={() => setHasConfirmedSavings(false)}
                              >
                                Not yet
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-end">
                            <div className="text-left">
                              <p className="text-2xl font-bold text-[var(--success)] flex items-center gap-2">
                                <ShieldCheck size={24} /> Mission Accomplished!
                              </p>
                              <p className="text-xs text-[var(--text-muted)] mt-1">
                                You've successfully protected your ₹{formatAmount(targetSurplus)} cushion this month.
                              </p>
                              <button 
                                onClick={() => setHasConfirmedSavings(false)}
                                className="text-[10px] text-[var(--accent)] hover:underline mt-2 font-bold uppercase tracking-widest"
                              >
                                Undo Confirmation
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Success Rate</p>
                              <p className="text-lg font-bold text-[var(--success)]">100%</p>
                            </div>
                          </div>
                        )}
                        <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: hasConfirmedSavings ? '100%' : `${Math.min(100, (dynamicSurplusProjection / (targetSurplus || 1)) * 100)}%` }}
                            className={cn(
                              "h-full transition-all duration-1000",
                              hasConfirmedSavings || dynamicSurplusProjection >= targetSurplus ? "bg-[var(--success)]" : "bg-[var(--accent)]"
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--bg-surface)] border-[var(--border)] overflow-hidden relative group">
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-[var(--success-subtle)] text-[var(--success)]">
                          <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] text-left">Total Savings Corpus</h3>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div className="text-left">
                          <p className="text-3xl font-bold text-[var(--text-primary)]">
                            {formatAmount(goals.reduce((s, g) => s + (g.current_amount || 0), 0))}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            Your total wealth across {goals.length} active goals
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--success)]/30 transition-colors">
                          <TrendingUp size={24} className="text-[var(--success)] opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </CardContent>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[var(--success)]/5 rounded-full blur-2xl group-hover:bg-[var(--success)]/10 transition-colors" />
                  </Card>
                </div>

                {/* Goals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map((g, i) => (
                    <GoalCard
                      key={g.id}
                      name={g.name}
                      target={g.target_amount}
                      current={g.current_amount}
                      deadline={g.deadline}
                      monthlySavings={g.monthly_contribution}
                      index={i}
                      onEdit={() => handleEditGoal(g)}
                    />
                  ))}
                  {goals.length === 0 && (
                    <div className="md:col-span-2 bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-2xl p-16 text-center">
                      <div className="h-16 w-16 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)]">
                        <Target size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">What are you saving for?</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                        Whether it's a new gadget or an emergency fund, track your progress and reach your milestones faster.
                      </p>
                      <Button className="mt-8" onClick={() => setGoalModal(true)}>
                        <Plus size={16} className="mr-2" /> Start a New Goal
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Budget Modal */}
      <Dialog open={budgetModal} onOpenChange={(open) => { setBudgetModal(open); if (!open) setEditingBudgetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudgetId ? 'Edit Category Budget' : 'Set Category Budget'}</DialogTitle>
            <DialogDescription>
              {editingBudgetId ? 'Update your monthly spending limit.' : 'Set a monthly spending limit for a specific category.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Select
                value={isCustomCategory ? 'custom-new' : budgetCategory}
                onValueChange={(val) => {
                  if (val === 'custom-new') {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                    setBudgetCategory(val as ExpenseCategory);
                  }
                }}
                disabled={!!editingBudgetId}
              >
                <SelectTrigger label="Category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCategories(expenses).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="custom-new" className="text-[var(--accent)] font-medium border-t border-[var(--border)] mt-1">
                    + Custom Category...
                  </SelectItem>
                </SelectContent>
              </Select>

              {isCustomCategory && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Input
                    placeholder="Enter custom category name"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="bg-[var(--bg-elevated)]"
                    autoFocus
                    required
                  />
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Spending Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Economy', val: '1', desc: 'Minimal' },
                  { label: 'Standard', val: '2', desc: 'Balanced' },
                  { label: 'Priority', val: '3', desc: 'Generous' }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setBudgetLimit(p.val)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                      budgetLimit === p.val
                        ? "bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)]"
                        : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                    )}
                  >
                    <span className="text-xs font-bold">{p.label}</span>
                    <span className="text-[8px] opacity-70 mt-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" loading={submitting}>
                {editingBudgetId ? 'Update Budget' : 'Save Budget'}
              </Button>
              {editingBudgetId && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger-subtle)]"
                  onClick={() => handleDeleteBudget(editingBudgetId)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Goal Modal */}
      <Dialog open={goalModal} onOpenChange={(open) => { setGoalModal(open); if (!open) setEditingGoalId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoalId ? 'Edit Savings Goal' : 'Create Savings Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoalId ? 'Update your progress or target.' : 'Track your progress towards a big purchase or milestone.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4 pt-4">
            <Input
              label="Goal Name"
              placeholder="e.g. New MacBook Pro"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Amount"
                type="number"
                placeholder="0.00"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                leftIcon={<DollarSign size={14} />}
                required
              />
              <Input
                label="Current Savings"
                type="number"
                placeholder="0.00"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                leftIcon={<DollarSign size={14} />}
              />
            </div>
            <Input
              label="Monthly Contribution"
              type="number"
              placeholder="How much can you save this month?"
              value={goalContribution}
              onChange={(e) => setGoalContribution(e.target.value)}
              leftIcon={<TrendingDown size={14} />}
              required
            />
            <Input
              label="Target Date (Optional)"
              type="date"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
            />
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" loading={submitting}>
                {editingGoalId ? 'Update Goal' : 'Create Goal'}
              </Button>
              {editingGoalId && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger-subtle)]"
                  onClick={() => handleDeleteGoal(editingGoalId)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Global Savings Modal */}
      {plannedSavingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-1 text-[var(--text-primary)]">Adjust Monthly Savings</h3>
              <p className="text-xs text-[var(--text-muted)] mb-6">Enter your total target. We'll distribute it across your active goals.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">New Monthly Total</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={newTotalSavings}
                      onChange={(e) => setNewTotalSavings(e.target.value)}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl py-2.5 pl-7 pr-4 text-sm font-bold focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPlannedSavingsModal(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleUpdateTotalSavings} disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : 'Apply Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
