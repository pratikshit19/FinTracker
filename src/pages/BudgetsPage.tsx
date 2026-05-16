import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Wallet, Plus, AlertCircle, ShieldCheck, 
  Trash2, Activity, ChevronRight, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';
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
  buildMonthSummary, cn, getAvailableCategories
} from '@/lib/utils';

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
  
  // Core Financial Profile
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [savingsTarget, setSavingsTarget] = useState(5000);
  const [minLeftover, setMinLeftover] = useState(2000);
  
  const [loading, setLoading] = useState(true);
  const { currency, formatAmount } = useCurrency();

  // Modal States
  const [budgetModal, setBudgetModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [budgetsRes, goalsRes, expensesRes, subscriptionsRes, profileRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('monthly_income, savings_target, min_leftover').eq('id', user.id).single(),
    ]);

    if (budgetsRes.data) setBudgets(budgetsRes.data);
    // Filter out old abstractions if they exist
    if (goalsRes.data) {
      setGoals(goalsRes.data.filter((g: Goal) => g.name !== 'Wealth Vault' && g.name !== 'Savings Config'));
    }
    if (expensesRes.data) setExpenses(expensesRes.data);
    if (subscriptionsRes.data) setSubscriptions(subscriptionsRes.data as Subscription[]);
    
    if (profileRes.data) {
      setMonthlyIncome(profileRes.data.monthly_income || 0);
      setSavingsTarget(profileRes.data.savings_target || 5000);
      setMinLeftover(profileRes.data.min_leftover || 2000);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategory || !budgetLimit) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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

      const { error } = await supabase.from('goals').upsert({
        ...(editingGoalId ? { id: editingGoalId } : {}),
        ...goalData
      });

      if (!error) {
        await fetchData();
        setGoalModal(false);
        setGoalName('');
        setGoalTarget('');
        setGoalCurrent('');
        setGoalContribution('');
        setGoalDeadline('');
        setEditingGoalId(null);
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
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) {
      await fetchData();
      setGoalModal(false);
      setEditingGoalId(null);
    }
  };

  const handleUpdateAllocation = async (id: string, amount: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newAmount = Math.max(0, (goal.current_amount || 0) + amount);
    await supabase.from('goals').update({ current_amount: newAmount }).eq('id', id);
    await fetchData();
  };

  // --- Core Financial Math ---
  const now = new Date();
  const summary = buildMonthSummary(expenses, now.getFullYear(), now.getMonth());

  const fixedExpenses = subscriptions.reduce((sum, sub) => {
    if (sub.billing_cycle === 'monthly') return sum + sub.amount;
    if (sub.billing_cycle === 'yearly') return sum + sub.amount / 12;
    if (sub.billing_cycle === 'weekly') return sum + sub.amount * 4.33;
    return sum;
  }, 0);

  // The Clean Formula
  const disposableIncome = Math.max(0, monthlyIncome - fixedExpenses);
  const freeToSpend = disposableIncome - savingsTarget - minLeftover;
  const isTightMonth = freeToSpend < 0;

  // Time metrics
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth + 1;

  const dailyAllowance = freeToSpend > 0 ? freeToSpend / daysRemaining : 0;
  
  // Smart Budget Capacity (distribute freeToSpend among categories)
  const totalWeight = budgets.reduce((s, b) => s + (b.monthly_limit || 1), 0);
  const budgetCapacity = Math.max(0, freeToSpend);
  
  const smartBudgets = budgets.map(b => {
    const weight = b.monthly_limit || 1;
    const proportionalLimit = totalWeight > 0 ? (weight / totalWeight) * budgetCapacity : 0;
    const ceilingPercent = weight === 1 ? 0.05 : weight === 2 ? 0.10 : 0.15;
    const strictCeiling = monthlyIncome * ceilingPercent;

    return {
      ...b,
      dynamic_limit: Math.min(proportionalLimit, strictCeiling)
    };
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Budgets & Goals</h1>
        <p className="text-sm text-[var(--text-muted)]">Organize your spending and plan for your future</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
        <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('budgets')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all duration-200",
              activeTab === 'budgets'
                ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <Wallet size={16} />
            Budgets
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all duration-200",
              activeTab === 'goals'
                ? "bg-[var(--bg-surface)] text-[var(--accent)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <Target size={16} />
            Goals
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === 'budgets' ? (
            <Button className="w-full sm:w-auto gap-2" onClick={() => { setEditingBudgetId(null); setBudgetCategory(''); setBudgetLimit(''); setIsCustomCategory(false); setCustomCategoryName(''); setBudgetModal(true); }}>
              <Plus size={16} /> New Budget
            </Button>
          ) : (
            <Button className="w-full sm:w-auto gap-2" onClick={() => { setEditingGoalId(null); setGoalName(''); setGoalTarget(''); setGoalCurrent(''); setGoalContribution(''); setGoalDeadline(''); setGoalModal(true); }}>
              <Plus size={16} /> New Goal
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
                {/* Simplified Budget Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Card 1: Free to Spend */}
                  <Card className={cn(
                    "relative overflow-hidden border-none text-white transition-all duration-500",
                    isTightMonth
                      ? "bg-gradient-to-br from-[var(--danger)] to-[var(--danger-hover)] shadow-danger/20"
                      : "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)]"
                  )}>
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 flex items-center gap-2">
                          {isTightMonth ? "Tight Month Warning" : "Free to Spend"}
                        </p>
                        {isTightMonth && <AlertCircle size={14} className="animate-pulse" />}
                      </div>
                      <div className="text-3xl font-bold">
                        {isTightMonth ? `-${formatAmount(Math.abs(freeToSpend))}` : formatAmount(freeToSpend)}
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
                        <ShieldCheck size={14} />
                        After {formatAmount(savingsTarget)} Savings & {formatAmount(minLeftover)} Leftover
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Daily Allowance */}
                  <Card className="bg-[var(--bg-surface)] border-[var(--border)]">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Daily Allowance
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className={cn(
                          "text-3xl font-bold",
                          dailyAllowance < 200 ? "text-[var(--warning)]" : "text-[var(--text-primary)]"
                        )}>
                          {formatAmount(dailyAllowance)}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">/ day</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-4">
                        <Activity size={14} className="text-[var(--text-secondary)]" />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {daysRemaining} days left in {now.toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Month Progress */}
                  <Card className="bg-[var(--bg-surface)] border-[var(--border)]">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Month Progress</p>
                      </div>
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        {formatAmount(summary.totalSpent)}
                      </div>
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-bold">
                          <span>Spent</span>
                          <span>Budget: {formatAmount(budgetCapacity)}</span>
                        </div>
                        <div className="relative h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "absolute top-0 left-0 h-full transition-all duration-1000",
                              summary.totalSpent > budgetCapacity ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
                            )}
                            style={{ width: `${Math.min(100, budgetCapacity > 0 ? (summary.totalSpent / budgetCapacity) * 100 : 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Budgets Grid */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Category Budgets</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {smartBudgets.map(budget => (
                      <BudgetCard
                        key={budget.id}
                        category={budget.category}
                        limit={budget.monthly_limit}
                        adjustedLimit={budget.dynamic_limit}
                        spent={summary.categoryBreakdown[budget.category] || 0}
                        onEdit={() => handleEditBudget(budget)}
                      />
                    ))}
                    <button
                      onClick={() => { setEditingBudgetId(null); setBudgetCategory(''); setBudgetLimit(''); setIsCustomCategory(false); setCustomCategoryName(''); setBudgetModal(true); }}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all group min-h-[160px]"
                    >
                      <div className="h-10 w-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all mb-3">
                        <Plus size={20} />
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">Add Budget Rule</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Configuration Panel */}
                <Card className="bg-[var(--bg-surface)] border-[var(--border)]">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Settings size={18} className="text-[var(--accent)]" />
                          Global Savings Configuration
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                          Your targets are set to <strong>{formatAmount(savingsTarget)}</strong> savings and <strong>{formatAmount(minLeftover)}</strong> minimum leftover per month.
                        </p>
                      </div>
                      <Link to="/settings">
                        <Button variant="outline" className="shrink-0 gap-2">
                          Configure in Settings <ChevronRight size={16} />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Specific Goals Grid */}
                <div className="space-y-6">
                  <div className="flex items-end justify-between border-b border-[var(--border)] pb-4">
                    <div>
                      <h2 className="text-2xl font-black text-[var(--text-primary)]">Your Milestones</h2>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Track specific purchases and goals</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((g, i) => (
                      <GoalCard
                        key={g.id}
                        id={g.id}
                        name={g.name}
                        target={g.target_amount}
                        current={g.current_amount}
                        deadline={g.deadline}
                        monthlySavings={g.monthly_contribution}
                        totalMonthlyTarget={savingsTarget}
                        index={i}
                        onEdit={() => handleEditGoal(g)}
                        onUpdateAllocation={handleUpdateAllocation}
                        onTransfer={() => {}} // Removed vault transfer logic
                      />
                    ))}

                    <button
                      onClick={() => {
                        setEditingGoalId(null);
                        setGoalName('');
                        setGoalTarget('');
                        setGoalCurrent('');
                        setGoalContribution('');
                        setGoalDeadline('');
                        setGoalModal(true);
                      }}
                      className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all group min-h-[200px]"
                    >
                      <div className="h-12 w-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all mb-4">
                        <Plus size={24} />
                      </div>
                      <span className="text-sm font-bold text-[var(--text-primary)]">Add New Goal</span>
                      <span className="text-xs text-[var(--text-muted)] mt-1">e.g. New Car, Vacation, Laptop</span>
                    </button>
                  </div>
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
              Track your progress towards a big purchase or milestone.
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
                required
              />
              <Input
                label="Current Savings"
                type="number"
                placeholder="0.00"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
              />
            </div>
            <Input
              label="Monthly Contribution"
              type="number"
              placeholder="How much can you save this month?"
              value={goalContribution}
              onChange={(e) => setGoalContribution(e.target.value)}
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
    </div>
  );
};
