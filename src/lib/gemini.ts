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

export interface WealthAdvice {
  summary: string;
  incomeStrategies: string[];
  wealthSteps: string[];
  challenge: string;
  savingsRatePercent: number;
  isLocal: boolean;
}

function buildLocalWealthAdvice(monthlyIncome: number, activeSips: { name: string; amount: number }[], totalSip: number, currency: string): WealthAdvice {
  const savingsRate = monthlyIncome > 0 ? Math.round((totalSip / monthlyIncome) * 100) : 0;
  
  let summaryText = "";
  if (totalSip === 0) {
    summaryText = `You don't have any active SIPs tracking yet. Starting even a small monthly investment (e.g., ${currency}1,000 or ${currency}2,000) is the most powerful step to secure your financial future.`;
  } else if (savingsRate < 10) {
    summaryText = `Your active SIPs total ${currency}${totalSip.toLocaleString()} monthly (approx. ${savingsRate}% of your income). You have a solid foundation, but there is room to accelerate. Aim to increase your savings rate to 15-20% to speed up your financial independence timeline.`;
  } else if (savingsRate <= 25) {
    summaryText = `Impressive! You are investing ${currency}${totalSip.toLocaleString()} monthly, which is about ${savingsRate}% of your income. You are in a healthy wealth-building zone. Stepping up this amount by just 10% each year will compound into massive wealth over the next decade.`;
  } else {
    summaryText = `Fantastic! You're an aggressive wealth accumulator, investing ${currency}${totalSip.toLocaleString()} monthly (${savingsRate}% of your income). You are fast-tracking your financial freedom. Focus on asset allocation and expanding your income streams further.`;
  }

  const incomeStrategies = [
    "🚀 Skill Monetization & Freelancing: Identify your top skill (e.g., development, copywriting, design, tutoring) and allocate 3-5 hours a week on platforms like Upwork or Contra. An extra income of just 20% can double your monthly SIP contribution.",
    "📦 Create Digital Assets: Package your knowledge into templates, databases (e.g., Notion), or short guides and list them on Gumroad. Digital products have 100% margins and generate compounding passive income.",
    "🌐 High-Value Consulting: Offer 1-on-1 strategic advisory sessions in your domain. Tools like Calendly and Luma make scheduling and charging for hourly consults completely frictionless."
  ];

  const wealthSteps = [
    `📈 Activate a Step-Up SIP: An annual step-up of 10% on your current ${currency}${totalSip.toLocaleString()} SIP means next year you invest ${currency}${(totalSip * 1.1).toFixed(0)}. This subtle lifestyle adjustment can increase your 10-year wealth by over 45%.`,
    "🛡️ Emergency Shield: Ensure you have 3 to 6 months of basic expenses in a high-yield liquid fund before locking capital in long-term equities, protecting your investments from forced liquidations.",
    "⚡ Automate the First Hour: Set your SIP debit date to 1 or 2 days after your salary credit. Pay your future self first, before you get a chance to spend it on lifestyle inflation."
  ];

  const challenges = [
    "Identify one recurring unused subscription, cancel it today, and increase your monthly SIP by that exact amount.",
    "The 24-Hour Rule: Delay any non-essential purchase above a certain amount by 24 hours. If you still want it, buy it; if not, transfer that amount directly to your investment account.",
    "Perform a quick skills audit: List 3 things people ask for your help with, and brainstorm a simple service page you could set up in under an hour."
  ];

  const randomChallenge = challenges[Math.floor(Math.abs(monthlyIncome + totalSip) % challenges.length)];

  return {
    summary: summaryText,
    incomeStrategies,
    wealthSteps,
    challenge: randomChallenge,
    savingsRatePercent: savingsRate,
    isLocal: true
  };
}

export async function generateWealthCoachAdvice(
  monthlyIncome: number,
  activeSips: { name: string; amount: number }[],
  totalSip: number,
  currency: string
): Promise<WealthAdvice> {
  if (!GEMINI_API_KEY) {
    return buildLocalWealthAdvice(monthlyIncome, activeSips, totalSip, currency);
  }

  const sipDetails = activeSips.map(s => `${s.name}: ${s.amount} ${currency}/month`).join(', ') || 'No active SIPs';
  const prompt = `You are a premium personal finance coach and active income strategist.
  The user has the following profile:
  - Monthly Income: ${monthlyIncome} ${currency}
  - Total Monthly SIPs: ${totalSip} ${currency}
  - Active SIPs: ${sipDetails}
  
  Provide hyper-personalized wealth building and active income strategies to help the user grow extremely wealthy.
  In "summary": Analyze their current savings rate (Total SIPs / Income), celebrate their discipline, and explain how they can optimize it.
  In "incomeStrategies": Suggest exactly 3 customized, practical, and highly lucrative ways to make active side income in today's time based on their capacity (e.g. niche freelancing, consulting, building digital assets/templates). Be extremely specific and actionable.
  In "wealthSteps": List exactly 3 powerful mathematical or psychological wealth tips (e.g., the magic of a 10% annual Step-up SIP, automation rules, cutting high-value leakage).
  In "challenge": Give exactly 1 actionable financial challenge for this week.
  
  Respond ONLY with valid JSON in this exact format:
  {
    "summary": "...",
    "incomeStrategies": ["...", "...", "..."],
    "wealthSteps": ["...", "...", "..."],
    "challenge": "...",
    "savingsRatePercent": <integer 0-100>,
    "isLocal": false
  }`;

  try {
    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return { ...(JSON.parse(jsonMatch[0]) as WealthAdvice), isLocal: false };
  } catch (error) {
    console.error('[Fintrack] Gemini wealth advice generation failed, using local engine:', error);
    return buildLocalWealthAdvice(monthlyIncome, activeSips, totalSip, currency);
  }
}

export async function askWealthCoach(
  question: string,
  chatHistory: { role: string; text: string }[],
  monthlyIncome: number,
  activeSips: { name: string; amount: number }[],
  totalSip: number,
  currency: string
): Promise<string> {
  const text = question.trim().toLowerCase();
  
  // Local smart router check
  if (!GEMINI_API_KEY) {
    if (text.includes('side hustle') || text.includes('hustle') || text.includes('make money') || text.includes('earn more')) {
      return `To make more money today, focus on "micro-consulting" or packaging what you already do. Since you have a ${currency}${totalSip.toLocaleString()} SIP, earning just an extra 20% on the side allows you to double your investments. Set up a simple bio link (like Contra or Bento), write down your top 3 professional skills, and pitch to 5 potential clients this week.`;
    }
    if (text.includes('step-up') || text.includes('stepup') || text.includes('increase sip') || text.includes('compound')) {
      return `A Step-Up SIP is the ultimate cheat code for wealth. By increasing your ${currency}${totalSip.toLocaleString()} SIP by just 10% each year, your contributions align with salary hikes. Over 10 years at a 12% return, a standard SIP accumulates considerable wealth, but a 10% Step-Up SIP nearly doubles the final returns because of aggressive backend compounding.`;
    }
    if (text.includes('save') || text.includes('cut') || text.includes('budget')) {
      return `To find investment fuel: check your automatic subscriptions first. Identify one service you haven't used in 30 days and terminate it immediately. Then, set a "first hour" automation rule—move your SIP debit date to the morning after payday so you invest before spending.`;
    }
    return `As your Wealth Coach, I advise focus on increasing your active income and maintaining a consistent step-up on your investments. Small adjustments in your daily savings, combined with high-value freelance projects or side income, can compound into financial freedom in under 10 years. What specific area of income generation or investing would you like to map out next?`;
  }

  const sipDetails = activeSips.map(s => `${s.name}: ${s.amount} ${currency}/month`).join(', ') || 'No active SIP';
  const historyText = chatHistory.slice(-4).map(h => `${h.role === 'user' ? 'User' : 'Coach'}: ${h.text}`).join('\n');

  const prompt = `You are a world-class financial freedom mentor and wealth building coach.
  The user has:
  - Monthly Income: ${monthlyIncome} ${currency}
  - Total Monthly SIPs: ${totalSip} ${currency} (${sipDetails})
  
  Recent Conversation History:
  ${historyText}
  
  User's Question: "${question}"
  
  Provide a highly motivating, practical, and mathematically sound coaching answer (3 sentences max). Suggest actionable steps to earn more or optimize their compound interest. Focus on modern wealth building.`;

  try {
    return await callGemini(prompt);
  } catch (err) {
    console.error('[Fintrack] Gemini wealth coach chat failed, using local router:', err);
    // Simple fallback logic
    if (text.includes('side hustle') || text.includes('hustle') || text.includes('make money') || text.includes('earn more')) {
      return `To make more money today, focus on "micro-consulting" or packaging what you already do. Since you have a ${currency}${totalSip.toLocaleString()} SIP, earning just an extra 20% on the side allows you to double your investments. Set up a simple bio link (like Contra or Bento), write down your top 3 professional skills, and pitch to 5 potential clients this week.`;
    }
    return `As your Wealth Coach, I advise focus on increasing your active income and maintaining a consistent step-up on your investments. Small adjustments in your daily savings, combined with high-value freelance projects or side income, can compound into financial freedom in under 10 years. What specific area of income generation or investing would you like to map out next?`;
  }
}

