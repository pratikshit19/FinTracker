import type { AIInsight, MonthSummary } from '@/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.error('[Fintrack] Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file.');
    throw new Error('API_KEY_MISSING');
  }

  const tryRequest = async (url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });
    return res;
  };

  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro'
  ];

  let lastStatus = 0;
  let lastErrorData = {};

  for (const model of models) {
    try {
      // Try both v1 and v1beta for each model
      for (const version of ['v1', 'v1beta']) {
        const response = await tryRequest(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`);
        
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } else {
          lastStatus = response.status;
          lastErrorData = await response.json().catch(() => ({}));
          console.warn(`[Fintrack] Gemini ${model} (${version}) failed:`, lastStatus);
        }
      }
    } catch (e) {
      console.error(`[Fintrack] Network error calling ${model}:`, e);
    }
  }

  // If we reach here, all models failed
  console.error('[Fintrack] All Gemini models failed. Last status:', lastStatus, lastErrorData);
  
  if (lastStatus === 401 || lastStatus === 403) {
    throw new Error('INVALID_API_KEY');
  }
  if (lastStatus === 429) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }
  throw new Error(`API_ERROR_${lastStatus || 'UNKNOWN'}`);
}

export async function generateExpenseInsights(summary: MonthSummary, currency: string): Promise<AIInsight> {
  const categoryList = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: ${amt.toFixed(2)} ${currency}`)
    .join(', ');

  const prompt = `You are an expert personal finance coach. Analyze the following monthly expense data and provide a deep-dive audit of the user's spending. Use the currency symbol for ${currency} in all your text descriptions.

Monthly Summary:
- Total Spent: ${summary.totalSpent.toFixed(2)} ${currency}
- Number of Transactions: ${summary.transactionCount}
- Average per Day: ${summary.avgPerDay.toFixed(2)} ${currency}
- Top Category: ${summary.topCategory}
- Category Breakdown: ${categoryList}

Your goal is to identify "spending leaks" and provide high-impact, practical advice to reduce unnecessary expenses.

In your "summary":
- Be direct and analytical.
- Mention specific categories that look inflated compared to the overall budget.
- Identify patterns (e.g., "Frequent small transactions in ${summary.topCategory} are adding up").

In your "recommendations":
- Provide exactly 3 DETAILED, actionable tips.
- Don't give generic advice like "save more". Give specific tactics (e.g., "Switch to an annual plan for [service] to save 15%", "Limit ${summary.topCategory} visits to twice a week to save roughly ${ (summary.categoryBreakdown[summary.topCategory] || 0) * 0.3 } ${currency} monthly").

In your "anomalies":
- Identify any category that has seen a sudden spike or seems disproportionately high.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "score": <integer 0-100>,
  "recommendations": ["...", "...", "..."],
  "anomalies": ["..."],
  "topCategory": "${summary.topCategory}"
}`;

  try {
    const text = await callGemini(prompt);
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]) as AIInsight;
  } catch {
    // Fallback insight if API fails
    return {
      summary: `You spent $${summary.totalSpent.toFixed(2)} this month across ${summary.transactionCount} transactions. Your highest spending category was ${summary.topCategory}.`,
      score: 65,
      recommendations: [
        'Review your top spending category for potential savings.',
        'Set a monthly budget and track it weekly.',
        'Consider automating transfers to savings at the start of each month.',
      ],
      anomalies: [],
      topCategory: summary.topCategory,
    };
  }
}

export async function askQuestion(question: string, summary: MonthSummary, currency: string): Promise<string> {
  const categoryList = Object.entries(summary.categoryBreakdown)
    .map(([cat, amt]) => `${cat}: ${amt.toFixed(2)} ${currency}`)
    .join(', ');

  const prompt = `You are a helpful personal finance assistant. The user has this month's expense data:
- Total: ${summary.totalSpent.toFixed(2)} ${currency}, ${summary.transactionCount} transactions
- Categories: ${categoryList}

Answer this question concisely (2-3 sentences max): "${question}"`;

  try {
    return await callGemini(prompt);
  } catch (err: any) {
    if (err.message === 'INVALID_API_KEY') {
      return "Your AI API key seems invalid. Please check your .env file.";
    }
    if (err.message === 'RATE_LIMIT_EXCEEDED') {
      return "The AI is a bit busy right now (rate limit reached). Please try again in a minute!";
    }
    return "I'm having trouble thinking right now. Please try again in a few seconds!";
  }
}
