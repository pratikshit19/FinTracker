import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Wallet, Plus, AlertCircle, 
  ArrowRight, ShieldCheck, TrendingDown, DollarSign, Trash2
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
import { ALL_CATEGORIES, buildMonthSummary, cn } from '@/lib/utils';
import type { Budget, Goal, Expense, ExpenseCategory } from '@/types';

type TabType = 'budgets' | 'goals';

export const BudgetsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('budgets');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [budgetsRes, goalsRes, expensesRes, profileRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('monthly_income').eq('id', user.id).single(),
    ]);

    if (budgetsRes.data) setBudgets(budgetsRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    if (expensesRes.data) setExpenses(expensesRes.data);
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
      const { error } = await supabase.from('budgets').upsert({
        id: editingBudgetId || undefined, // Include ID if editing to ensure update
        user_id: user.id,
        category: budgetCategory,
        monthly_limit: parseFloat(budgetLimit)
      }, { onConflict: 'user_id,category' });
      
      if (!error) {
        await fetchData();
        setBudgetModal(false);
        setBudgetCategory('');
        setBudgetLimit('');
        setEditingBudgetId(null);
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
    await supabase.from('goals').delete().eq('id', id);
    fetchData();
  };

  const now = new Date();
  const summary = buildMonthSummary(expenses, now.getFullYear(), now.getMonth());

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financial Planner</h1>
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
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Income Baseline</p>
                      <div className="text-3xl font-bold">
                        {formatAmount(monthlyIncome)}
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-sm opacity-90">
                        <DollarSign size={14} />
                        Your monthly salary
                      </div>
                    </CardContent>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
                  </Card>

                  <Card className="bg-[var(--bg-surface)] border-[var(--border)]">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Total Budget</p>
                      <div className="text-3xl font-bold text-[var(--text-primary)]">
                        {formatAmount(budgets.reduce((s, b) => s + b.monthly_limit, 0))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-4">
                        <Wallet size={14} className="text-[var(--accent)]" />
                        <span className="text-sm text-[var(--text-secondary)]">Allocated across {budgets.length} cats</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={cn(
                    "bg-[var(--bg-surface)] border-[var(--border)]",
                    (monthlyIncome - budgets.reduce((s, b) => s + b.monthly_limit, 0)) < 0 ? "border-[var(--danger)]/50" : ""
                  )}>
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Savings Buffer</p>
                      <div className={cn(
                        "text-3xl font-bold",
                        (monthlyIncome - budgets.reduce((s, b) => s + b.monthly_limit, 0)) < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"
                      )}>
                        {formatAmount(monthlyIncome - budgets.reduce((s, b) => s + b.monthly_limit, 0))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-4">
                        <ShieldCheck size={14} className={cn(
                          (monthlyIncome - budgets.reduce((s, b) => s + b.monthly_limit, 0)) < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"
                        )} />
                        <span className="text-sm text-[var(--text-secondary)]">Left for goals & savings</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Smart Tip Card */}
                {monthlyIncome > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent)]/10 flex items-start gap-4"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">Smart Budgeting Tip</h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {budgets.reduce((s, b) => s + b.monthly_limit, 0) > monthlyIncome * 0.7 
                          ? `Warning: Your total budget is ${((budgets.reduce((s, b) => s + b.monthly_limit, 0) / monthlyIncome) * 100).toFixed(0)}% of your income. Financial experts recommend keeping essentials under 50% to maximize savings.`
                          : `Great job! Your current budget leaves ${(((monthlyIncome - budgets.reduce((s, b) => s + b.monthly_limit, 0)) / monthlyIncome) * 100).toFixed(0)}% of your income for savings. You're well on your way to hitting your financial goals.`}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Budget Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {budgets.map((b, i) => (
                    <BudgetCard
                      key={b.id}
                      category={b.category}
                      limit={b.monthly_limit}
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

                  <Card className="bg-[var(--bg-surface)] border-[var(--border)]">
                    <CardContent className="pt-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Monthly Goal Progress</p>
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
      <Dialog open={budgetModal} onOpenChange={(open) => { setBudgetModal(open); if(!open) setEditingBudgetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudgetId ? 'Edit Category Budget' : 'Set Category Budget'}</DialogTitle>
            <DialogDescription>
              {editingBudgetId ? 'Update your monthly spending limit.' : 'Set a monthly spending limit for a specific category.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-4 pt-4">
            <Select 
              value={budgetCategory} 
              onValueChange={(val) => setBudgetCategory(val as ExpenseCategory)}
              disabled={!!editingBudgetId}
            >
              <SelectTrigger label="Category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              label="Monthly Limit"
              type="number"
              placeholder="0.00"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              leftIcon={<span className="text-xs font-bold text-[var(--text-muted)]">{CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>}
              required
            />
            {monthlyIncome > 0 && budgetLimit && (
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                  <span>Remaining after this</span>
                  <span className={(monthlyIncome - (budgets.filter(b => b.id !== editingBudgetId).reduce((s, b) => s + b.monthly_limit, 0) + parseFloat(budgetLimit))) < 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}>
                    {formatAmount(monthlyIncome - (budgets.filter(b => b.id !== editingBudgetId).reduce((s, b) => s + b.monthly_limit, 0) + parseFloat(budgetLimit)))}
                  </span>
                </div>
                <div className="h-1 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${Math.min(100, ((budgets.filter(b => b.id !== editingBudgetId).reduce((s, b) => s + b.monthly_limit, 0) + parseFloat(budgetLimit)) / monthlyIncome) * 100)}%` }}
                  />
                </div>
              </div>
            )}
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
      <Dialog open={goalModal} onOpenChange={(open) => { setGoalModal(open); if(!open) setEditingGoalId(null); }}>
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
    </div>
  );
};
