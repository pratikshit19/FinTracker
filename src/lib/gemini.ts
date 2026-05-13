import type { AIInsight, MonthSummary } from '@/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

function buildLocalInsight(summary: MonthSummary, currency: string, note?: string): AIInsight {
  const categories = Object.entries(summary.categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const [topCategory, topAmount] = categories[0] ?? ['Other', 0];
  const secondCategory = categories[1]?.[0] ?? null;
  const secondAmount = categories[1]?.[1] ?? 0;
  const score = Math.max(40, Math.min(85, Math.round(85 - summary.totalSpent / 50)));
  const anomalies: string[] = [];

  if (topAmount > summary.totalSpent * 0.4) {
    anomalies.push(`${topCategory} represents more than 40% of your spending.`);
  }
  if (secondCategory && secondAmount > summary.totalSpent * 0.2) {
    anomalies.push(`${secondCategory} is also a significant category at ${currency}${secondAmount.toFixed(2)}.`);
  }
  if (summary.transactionCount > 28) {
    anomalies.push('A high number of transactions may indicate frequent impulse spending.');
  }

  const summaryText = note
    ? `${note} Here is a quick local summary: You spent ${currency}${summary.totalSpent.toFixed(2)} this month across ${summary.transactionCount} transactions. Your top category was ${topCategory}.`
    : `You spent ${currency}${summary.totalSpent.toFixed(2)} this month across ${summary.transactionCount} transactions. Your top category was ${topCategory}.`;

  const recommendations = [
    `Review the ${topCategory} spending bucket and identify one area where you can cut back by at least 10%.`,
    secondCategory
      ? `Your second largest category is ${secondCategory}. Try trimming that category by reducing one recurring cost or luxury purchase.`
      : 'Track your expenses for a few more weeks to uncover recurring spending patterns.',
    'Set a weekly check-in and move any unspent money into savings at the end of the week.',
  ];

  return {
    summary: summaryText,
    score,
    recommendations,
    anomalies,
    topCategory: String(topCategory),
  };
}

function buildLocalAnswer(question: string, summary: MonthSummary, currency: string): string {
  const categories = Object.entries(summary.categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const [topCategory, topAmount] = categories[0] ?? ['Other', 0];
  const [secondCategory] = categories[1] ?? [''];
  const text = question.trim().toLowerCase();
  const prefix = !GEMINI_API_KEY ? 'No Gemini API key found. ' : '';

  if (text.includes('biggest') || text.includes('top expense') || text.includes('largest')) {
    return `${prefix}Your biggest expense category is ${topCategory} at ${currency}${topAmount.toFixed(2)}.`;
  }
  if (text.includes('save') || text.includes('reduce') || text.includes('spend less')) {
    return `${prefix}Focus on reducing ${topCategory} spending first. Review recurring costs and cut one non-essential subscription or service to save money.`;
  }
  if (text.includes('dining') || text.includes('food') || text.includes('eating')) {
    return `${prefix}If dining is high, try cooking at home more often and set a weekly dining budget to keep meals under control.`;
  }
  if (text.includes('month') || text.includes('weekly')) {
    return `${prefix}You spent ${currency}${summary.totalSpent.toFixed(2)} this month across ${summary.transactionCount} transactions. A weekly spending review can help keep your budget on track.`;
  }

  return `${prefix}You spent ${currency}${summary.totalSpent.toFixed(2)} this month. Your biggest category is ${topCategory}; focusing there will yield the highest savings.`;
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('[Fintrack] Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file.');
    throw new Error('API_KEY_MISSING');
  }

  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];
  const versions = ['v1beta2', 'v1'];
  const actions = ['generateText', 'generateContent', 'generate'];

  let lastStatus = 0;
  let lastErrorData: unknown = {};

  for (const model of models) {
    for (const version of versions) {
      for (const action of actions) {
        const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:${action}?key=${GEMINI_API_KEY}`;
        const body: Record<string, unknown> = {
          temperature: 0.7,
          maxOutputTokens: 1024,
        };

        if (action === 'generateContent') {
          body.contents = [{ parts: [{ text: prompt }] }];
        } else {
          body.prompt = { text: prompt };
        }

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${GEMINI_API_KEY}`,
            },
            body: JSON.stringify(body),
          });

          const data = await response.json().catch(() => ({}));

          if (response.ok) {
            const text =
              data?.candidates?.[0]?.content?.[0]?.text ??
              data?.candidates?.[0]?.content?.parts?.[0]?.text ??
              data?.output?.[0]?.content?.[0]?.text ??
              data?.output?.[0]?.content?.text ??
              data?.output?.text ??
              data?.responses?.[0]?.text ??
              data?.text;

            if (typeof text === 'string' && text.trim().length > 0) {
              return text;
            }
          } else {
            lastStatus = response.status;
            lastErrorData = data;
            console.warn(`[Fintrack] Gemini ${model} ${version}:${action} failed`, response.status, data);
          }
        } catch (error) {
          console.error(`[Fintrack] Gemini call failed for ${model} ${version}:${action}`, error);
        }
      }
    }
  }

  console.error('[Fintrack] All Gemini requests failed. Last status:', lastStatus, lastErrorData);

  if (lastStatus === 401 || lastStatus === 403) {
    throw new Error('INVALID_API_KEY');
  }
  if (lastStatus === 429) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  throw new Error(`API_ERROR_${lastStatus || 'UNKNOWN'}`);
}

export async function generateExpenseInsights(summary: MonthSummary, currency: string): Promise<AIInsight> {
  if (!GEMINI_API_KEY) {
    return buildLocalInsight(summary, currency, 'Gemini is unavailable.');
  }

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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]) as AIInsight;
  } catch (error) {
    console.error('[Fintrack] Gemini insight generation failed:', error);
    return buildLocalInsight(summary, currency, 'Gemini is unavailable.');
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

  if (!GEMINI_API_KEY) {
    return buildLocalAnswer(question, summary, currency);
  }

  try {
    return await callGemini(prompt);
  } catch (err: any) {
    if (err.message === 'INVALID_API_KEY') {
      return 'Your AI API key seems invalid. Please check your .env file.';
    }
    if (err.message === 'RATE_LIMIT_EXCEEDED') {
      return 'The AI is a bit busy right now (rate limit reached). Please try again in a minute!';
    }
    return buildLocalAnswer(question, summary, currency);
  }
}
