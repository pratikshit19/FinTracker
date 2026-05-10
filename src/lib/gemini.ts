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

  // Try the most stable production endpoint first
  let response = await tryRequest(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`);
  
  // If 404, try v1beta
  if (response.status === 404) {
    response = await tryRequest(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`);
  }

  // If still 404, try the older pro model
  if (response.status === 404) {
    response = await tryRequest(`https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Fintrack] Gemini API error:', response.status, errorData);
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
  } catch {
    return "I couldn't connect to the AI service right now. Please check your API key and try again.";
  }
}
