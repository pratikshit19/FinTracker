import { useState, useEffect } from 'react';
import { Check, Moon, Droplets, Leaf, Monitor } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Theme = 'default' | 'oled' | 'glass' | 'matcha';

const THEMES: { id: Theme; name: string; description: string; icon: any; color: string; bg: string }[] = [
  { id: 'default', name: 'Dark Mode', description: 'The standard premium dark experience.', icon: Monitor, color: '#1b48dbe3', bg: '#0a0a0a' },
  { id: 'oled', name: 'Midnight OLED', description: 'Pure black backgrounds for battery saving.', icon: Moon, color: '#f0f0f0', bg: '#000000' },
  { id: 'glass', name: 'Glassmorphism', description: 'Translucent layers with subtle glowing effects.', icon: Droplets, color: '#ec4899', bg: '#0f1115' },
  { id: 'matcha', name: 'Matcha Green', description: 'A calming, zen-centric aesthetic.', icon: Leaf, color: '#4ade80', bg: '#111412' }
];

export const ThemeSelector = () => {
  const [activeTheme, setActiveTheme] = useState<Theme>('default');

  useEffect(() => {
    const saved = localStorage.getItem('fintrace_theme') as Theme;
    if (saved && THEMES.find(t => t.id === saved)) {
      setActiveTheme(saved);
    }
  }, []);

  const handleSelectTheme = (themeId: Theme) => {
    setActiveTheme(themeId);
    localStorage.setItem('fintrace_theme', themeId);
    
    if (themeId === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEMES.map((theme) => {
          const Icon = theme.icon;
          const isActive = activeTheme === theme.id;
          
          return (
            <Card 
              key={theme.id}
              className={cn(
                "cursor-pointer transition-all duration-200 overflow-hidden relative border-2",
                isActive ? "border-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
              )}
              onClick={() => handleSelectTheme(theme.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div 
                  className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: theme.bg, borderColor: 'var(--border)' }}
                >
                  <Icon size={20} style={{ color: theme.color }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {theme.name}
                    {isActive && <Check size={14} className="text-[var(--accent)]" />}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{theme.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
