import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Check, Sparkles, Wallet, PiggyBank, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';

const WIZARD_STEPS = [
  {
    id: 'income',
    title: "Let's start with your Income.",
    description: "What is your fixed monthly salary after taxes? We'll use this as the baseline for your entire budget.",
    icon: Wallet,
    color: "var(--info)",
    bg: "var(--info-subtle)"
  },
  {
    id: 'savings',
    title: "Pay yourself first.",
    description: "How much of that income do you want to immediately lock away into savings or investments?",
    icon: PiggyBank,
    color: "var(--success)",
    bg: "var(--success-subtle)"
  },
  {
    id: 'leftover',
    title: "Set your safety net.",
    description: "What is the absolute minimum amount you want left in your checking account at the end of the month?",
    icon: ShieldCheck,
    color: "var(--warning)",
    bg: "var(--warning-subtle)"
  }
];

export const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const { getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();
  const [currentStep, setCurrentStep] = useState(0);
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('5000');
  const [leftover, setLeftover] = useState('2000');
  const [loading, setLoading] = useState(false);

  const next = async () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setLoading(true);
      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          monthly_income: parseFloat(income) || 0,
          savings_target: parseFloat(savings) || 0,
          min_leftover: parseFloat(leftover) || 0,
          updated_at: new Date().toISOString()
        });
      }
      
      localStorage.setItem('fintrace_onboarded', 'true');
      setLoading(false);
      onComplete();
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const step = WIZARD_STEPS[currentStep];
  const StepIcon = step.icon;

  const renderInput = () => {
    if (step.id === 'income') {
      return (
        <Input 
          type="number" autoFocus placeholder="e.g. 50000" 
          value={income} onChange={e => setIncome(e.target.value)} 
          leftIcon={<span className="text-xl font-bold">{symbol}</span>}
          className="h-16 text-2xl font-bold px-4"
        />
      );
    }
    if (step.id === 'savings') {
      return (
        <Input 
          type="number" autoFocus placeholder="e.g. 5000" 
          value={savings} onChange={e => setSavings(e.target.value)} 
          leftIcon={<span className="text-xl font-bold">{symbol}</span>}
          className="h-16 text-2xl font-bold px-4"
        />
      );
    }
    if (step.id === 'leftover') {
      return (
        <Input 
          type="number" autoFocus placeholder="e.g. 2000" 
          value={leftover} onChange={e => setLeftover(e.target.value)} 
          leftIcon={<span className="text-xl font-bold">{symbol}</span>}
          className="h-16 text-2xl font-bold px-4"
        />
      );
    }
  };

  const canProceed = () => {
    if (step.id === 'income') return income.trim() !== '';
    if (step.id === 'savings') return savings.trim() !== '';
    if (step.id === 'leftover') return leftover.trim() !== '';
    return false;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-base)] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-elevated)]/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[var(--accent)] flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">FinTrace Setup</span>
        </div>
        <button 
          onClick={() => {
            localStorage.setItem('fintrace_onboarded', 'true');
            onComplete();
          }}
          className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hover:text-[var(--text-primary)]"
        >
          Skip
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 max-w-2xl mx-auto w-full py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex-1 flex flex-col justify-center"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border"
              style={{ backgroundColor: step.bg, borderColor: step.color, color: step.color }}
            >
              <StepIcon size={32} />
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-4 leading-tight">
              {step.title}
            </h1>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed mb-12 max-w-lg">
              {step.description}
            </p>

            <div className="w-full max-w-sm mb-12">
              {renderInput()}
            </div>
            
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-col gap-4 mt-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-4">
            {WIZARD_STEPS.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentStep ? 'w-full bg-[var(--accent)]' : 
                  i < currentStep ? 'w-full bg-[var(--accent)]/40' : 'w-full bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={back}
                className="h-14 px-6 rounded-xl"
              >
                <ArrowLeft size={18} />
              </Button>
            )}
            
            <Button 
              onClick={next} 
              disabled={!canProceed() || loading}
              loading={loading}
              className="flex-1 h-14 text-base font-bold rounded-xl shadow-lg shadow-[var(--accent)]/20"
            >
              {currentStep === WIZARD_STEPS.length - 1 ? 'Save & Finish Setup' : 'Continue'}
              {currentStep < WIZARD_STEPS.length - 1 && <ChevronRight size={18} className="ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
