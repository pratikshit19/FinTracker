import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OnboardingStep {
  title: string;
  description: string;
  image: string;
  features?: string[];
}

const STEPS: OnboardingStep[] = [
  {
    title: "Smart Tracking",
    description: "Automatically categorize your spending with AI-Powered Scanning. Just snap a photo of any receipt and let our system do the heavy lifting for you.",
    image: "/onboarding_smart_tracking_1778411423492.png",
  },
  {
    title: "Manage Subscriptions",
    description: "Keep track of all your recurring bills and get notified before they are due.",
    image: "/onboarding_subscriptions_1778411437564.png",
    features: ["Monthly billing cycles tracked", "24-hour advance alerts"]
  },
  {
    title: "Deep insights into spending habits.",
    description: "Visualize your progress and reach your savings goals faster with detailed reports.",
    image: "/onboarding_insights_1778411455438.png"
  }
];

export const Onboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      localStorage.setItem('fintrace_onboarded', 'true');
      onComplete();
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-base)] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[var(--accent)] flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">FinTrace</span>
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
      <div className="flex-1 px-8 py-4 flex flex-col justify-between min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Image Container */}
            <div className="flex-1 min-h-[180px] max-h-[35vh] rounded-[32px] overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)] relative shadow-2xl shadow-black/20 mb-6">
              <img 
                src={step.image} 
                alt={step.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text Area */}
            <div className="text-center shrink-0">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Features (if any) */}
            {step.features && (
              <div className="mt-4 flex flex-col gap-2 shrink-0">
                {step.features.map((f, i) => (
                  <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-2.5 flex items-center gap-3">
                    <div className="h-4 w-4 rounded-md bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
                      <Check size={10} className="text-[var(--accent)]" />
                    </div>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer / Controls */}
        <div className="mt-8 flex flex-col gap-3 shrink-0">
          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div 
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-[var(--accent)]' : 'w-2 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          <Button 
            onClick={next} 
            className="w-full h-12 text-sm font-bold rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white shadow-lg shadow-[var(--accent)]/20"
          >
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
            {currentStep < STEPS.length - 1 && <ChevronRight size={16} className="ml-2" />}
          </Button>

          {currentStep > 0 ? (
            <button 
              onClick={back}
              className="w-full h-10 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div className="h-10" />
          )}
        </div>
      </div>
    </div>
  );
};
