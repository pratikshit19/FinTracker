import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

export type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatAmount: (amount: number) => string;
  getCurrencySymbol: () => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CURRENCIES: { code: CurrencyCode; name: string; symbol: string; locale: string }[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
];

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [loading, setLoading] = useState(true);

  // 1. Initial load from Supabase
  useEffect(() => {
    const loadUserCurrency = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('currency')
          .eq('id', user.id)
          .single();
        
        if (profile?.currency) {
          setCurrencyState(profile.currency as CurrencyCode);
          localStorage.setItem('fintrack_currency', profile.currency);
        }
      } else {
        // Fallback to local storage for guest users
        const saved = localStorage.getItem('fintrack_currency');
        if (saved) setCurrencyState(saved as CurrencyCode);
      }
      setLoading(false);
    };

    loadUserCurrency();

    // Listen for auth changes to reload currency
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserCurrency();
    });

    return () => subscription.unsubscribe();
  }, []);

  const setCurrency = async (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('fintrack_currency', code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Persist to Supabase
      await supabase
        .from('profiles')
        .upsert({ id: user.id, currency: code });
    }
  };

  const formatAmount = (amount: number) => {
    const config = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencySymbol = () => {
    const config = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
    return config.symbol;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, getCurrencySymbol, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
