import type { AIInsight, MonthSummary } from '@/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  if (!response.ok) throw new Error('Gemini API request failed');
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function generateExpenseInsights(summary: MonthSummary): Promise<AIInsight> {
  const categoryList = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(', ');

  const prompt = `You are a personal finance advisor AI. Analyze the following monthly expense data and provide actionable insights.

Monthly Summary:
- Total Spent: $${summary.totalSpent.toFixed(2)}
- Number of Transactions: ${summary.transactionCount}
- Average per Day: $${summary.avgPerDay.toFixed(2)}
- Top Category: ${summary.topCategory}
- Category Breakdown: ${categoryList}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "summary": "A 2-3 sentence summary of their spending behavior this month",
  "score": <integer 0-100 representing overall financial health, 100 being best>,
  "recommendations": ["tip 1", "tip 2", "tip 3"],
  "anomalies": ["anomaly 1 if any, otherwise empty array"],
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

export async function askQuestion(question: string, summary: MonthSummary): Promise<string> {
  const categoryList = Object.entries(summary.categoryBreakdown)
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
    .join(', ');

  const prompt = `You are a helpful personal finance assistant. The user has this month's expense data:
- Total: $${summary.totalSpent.toFixed(2)}, ${summary.transactionCount} transactions
- Categories: ${categoryList}

Answer this question concisely (2-3 sentences max): "${question}"`;

  try {
    return await callGemini(prompt);
  } catch {
    return "I couldn't connect to the AI service right now. Please check your API key and try again.";
  }
}
