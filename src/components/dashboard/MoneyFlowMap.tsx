import { useMemo } from 'react';
import ReactFlow, { 
  Handle, Position, Background, 
  ConnectionLineType
} from 'reactflow';
import type { NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';
import { GitFork, Wallet, ShieldCheck, Target, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useNavigate } from 'react-router-dom';

// Custom Node Component
const FlowNode = ({ data }: NodeProps) => {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const Icon = data.icon || Wallet;

  const handleClick = () => {
    if (data.targetPath) {
      navigate(data.targetPath);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      onClick={handleClick}
      className={cn(
        "px-3 py-2 sm:px-4 sm:py-3 rounded-xl border shadow-lg min-w-[140px] sm:min-w-[160px] relative overflow-hidden cursor-pointer transition-colors",
        data.type === 'source' ? "bg-[var(--accent)] border-[var(--accent-hover)] text-white" :
        data.type === 'sink' ? "bg-[var(--success-subtle)] border-[var(--success)]/20 text-[var(--success)]" :
        "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]/30"
      )}
    >
      {/* Decorative Glow */}
      <div className="absolute -right-2 -top-2 w-12 h-12 bg-white/10 blur-xl rounded-full" />
      
      <div className="flex items-center gap-3 relative z-10">
        <div className={cn(
          "p-2 rounded-lg flex items-center justify-center",
          data.type === 'source' ? "bg-white/20" : "bg-[var(--bg-surface)]"
        )}>
          <Icon size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
            {data.label}
          </span>
          <span className="text-sm font-bold truncate">
            {formatAmount(data.amount)}
          </span>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </motion.div>
  );
};

const nodeTypes = {
  flowNode: FlowNode,
};

interface MoneyFlowMapProps {
  salary: number;
  subscriptions: number;
  budgets: number;
  savings: number;
}

export const MoneyFlowMap = ({ 
  salary = 40000, 
  subscriptions = 0, 
  budgets = 0, 
  savings = 0 
}: MoneyFlowMapProps) => {
  const fixedCosts = subscriptions;
  const personalBudgetBuffer = Math.max(0, salary - fixedCosts);
  const savingsBuffer = Math.max(0, personalBudgetBuffer - budgets);
  const leftover = Math.max(0, savingsBuffer - savings);

  const nodes = useMemo(() => [
    {
      id: 'salary',
      type: 'flowNode',
      data: { label: 'Monthly Salary', amount: salary, icon: Sparkles, type: 'source', targetPath: '/settings' },
      position: { x: 250, y: 0 },
    },
    {
      id: 'fixedCosts',
      type: 'flowNode',
      data: { label: 'Fixed Expenses', amount: fixedCosts, icon: CreditCard, targetPath: '/fixed-expenses' },
      position: { x: 110, y: 140 },
    },
    {
      id: 'buffer',
      type: 'flowNode',
      data: { label: 'Variable', amount: personalBudgetBuffer, icon: Wallet, targetPath: '/fixed-expenses' },
      position: { x: 390, y: 140 },
    },
    {
      id: 'savingsBuffer',
      type: 'flowNode',
      data: { label: 'Savings Buffer', amount: savingsBuffer, icon: ShieldCheck, targetPath: '/budgets' },
      position: { x: 250, y: 300 },
    },
    {
      id: 'leftover',
      type: 'flowNode',
      data: { label: 'Cash Leftover', amount: leftover, icon: Wallet, type: 'sink', targetPath: '/transactions' },
      position: { x: 250, y: 420 },
    },
  ], [salary, fixedCosts, personalBudgetBuffer, savingsBuffer, savings, leftover]);

  const edges = useMemo(() => [
    { id: 'e1-2', source: 'salary', target: 'fixedCosts', animated: true, type: ConnectionLineType.SmoothStep, style: { stroke: 'var(--accent)', strokeWidth: 2 } },
    { id: 'e1-3', source: 'salary', target: 'buffer', animated: true, type: ConnectionLineType.SmoothStep, style: { stroke: 'var(--accent)', strokeWidth: 2 } },
    { id: 'e3-4', source: 'buffer', target: 'savingsBuffer', animated: true, type: ConnectionLineType.SmoothStep, style: { stroke: 'var(--border)', strokeWidth: 2 } },
    { id: 'e4-5', source: 'savingsBuffer', target: 'leftover', animated: true, type: ConnectionLineType.SmoothStep, style: { stroke: 'var(--success)', strokeWidth: 2 } },
  ], []);

  return (
    <Card className="h-full border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden min-h-[500px]">
      <CardHeader className="pb-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]/30">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <GitFork size={16} className="text-[var(--accent)]" />
          Live Money Flow Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[400px] sm:h-[550px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.05 }} // Reduced padding to make it larger
          preventScrolling={false}
          zoomOnScroll={false}
          panOnDrag={true}
          draggable={false}
          nodesConnectable={false}
          nodesDraggable={false}
          maxZoom={1.5} // Allow it to be larger than 100%
          minZoom={0.2} // Allow it to scale down more on mobile
        >
          <Background color="var(--border)" gap={20} size={1} />
        </ReactFlow>
      </CardContent>
    </Card>
  );
};
