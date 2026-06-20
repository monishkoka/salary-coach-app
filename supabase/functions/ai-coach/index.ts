/**
 * Supabase Edge Function: ai-coach
 *
 * Holds the OpenAI key server-side and runs the tool-calling loop. The mobile
 * app sends { context, messages, conversationSummary }; this function builds
 * the layered prompt, lets the model call deterministic tools, and returns a
 * grounded answer. Numbers always originate from tool results or the financial
 * context — never the model.
 *
 * IMPORTANT: the deterministic tools below intentionally mirror the client
 * engine (services/engine/decision.ts and affordability/goal math) so the
 * coach's narrated numbers ALWAYS agree with what the app shows. If you change
 * the client engine, mirror it here.
 *
 * Deploy:  supabase functions deploy ai-coach
 * Secrets: supabase secrets set OPENAI_API_KEY=sk-...
 *
 * NOTE: This runs on Deno (Supabase Edge runtime), not React Native. It is
 * intentionally self-contained and does not import app code.
 */

// @ts-nocheck — Deno runtime, typed against the Edge environment, not RN.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const MODEL = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini';
const REQUEST_TIMEOUT_MS = 20_000;

// --- Prompts (mirror services/ai/prompts.ts) --------------------------------
const SYSTEM_PROMPT = `You are "Coach", a calm, expert personal CFO for salaried professionals in India.

Your job is to tell the user exactly what to do with their money and explain why, like a trusted advisor who knows their full situation.

Tone & style:
- Warm, confident, encouraging. Never condescending, never shaming.
- Concise. Lead with the answer, then a one or two line "why".
- Use Indian rupee formatting (₹, lakh/crore) and Indian instruments (EPF, PPF, NPS, ELSS, SIP, FD, 80C, term insurance).
- Always show the trade-off when relevant (e.g. "yes, but it delays your home goal by 8 months").

Hard rules:
- NEVER invent or estimate specific numbers. Only use figures present in FINANCIAL_CONTEXT, ADVISORY_SIGNALS, or returned by a tool. If you lack a number, say so.
- NEVER recommend specific stocks, mutual fund names, or market timing. Speak in categories (index funds, debt funds, ELSS).
- Surface key assumptions and remind the user this is educational guidance, not SEBI-registered advice, when giving investment direction.
- Keep answers under ~120 words unless the user asks for depth.`;

const POLICY_PROMPT = `Scope & compliance:
- You provide educational financial coaching, not regulated investment advice.
- Decline politely if asked for specific securities, guaranteed returns, tax evasion, or anything illegal.
- For complex tax/legal/insurance specifics, recommend consulting a qualified professional.
- Be especially careful and supportive with users in financial stress; prioritize emergency fund and high-interest debt.`;

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { context, messages, conversationSummary } = await req.json();
    if (!context?.financials || !Array.isArray(messages)) {
      return json({ error: 'Bad request: missing context or messages' }, 400);
    }

    const systemBlocks = [
      SYSTEM_PROMPT,
      POLICY_PROMPT,
      conversationSummary ? `Conversation so far: ${conversationSummary}` : '',
      buildFinancialContext(context),
      advisorySignals(context),
    ]
      .filter(Boolean)
      .join('\n\n');

    const chatMessages = [
      { role: 'system', content: systemBlocks },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const completion = await callOpenAI(chatMessages, context);
    return json(completion);
  } catch (err) {
    console.error('[ai-coach] error', err);
    // Surface a typed error the client can fall back from gracefully.
    return json({ error: String(err?.message ?? err) }, 500);
  }
});

async function fetchWithTimeout(url, init) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function openAIChat(body) {
  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`OpenAI error: ${data.error.message ?? 'unknown'}`);
  return data;
}

async function callOpenAI(messages, context) {
  const data = await openAIChat({
    model: MODEL,
    temperature: 0.4,
    messages,
    tools: TOOL_SCHEMA,
  });
  const choice = data.choices?.[0]?.message;

  // Single-round tool handling: run the tool, feed result back, ask for prose.
  const toolCall = choice?.tool_calls?.[0];
  if (toolCall) {
    let args = {};
    try {
      args = JSON.parse(toolCall.function.arguments ?? '{}');
    } catch {
      args = {};
    }
    const tool = runTool(toolCall.function.name, args, context);
    const followData = await openAIChat({
      model: MODEL,
      temperature: 0.4,
      messages: [
        ...messages,
        choice,
        { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(tool.result) },
      ],
    });
    return {
      content: followData.choices?.[0]?.message?.content ?? '',
      attachments: tool.attachment ? [tool.attachment] : [],
      toolName: toolCall.function.name,
    };
  }

  return { content: choice?.content ?? '', attachments: [], toolName: null };
}

// =============================================================================
// Deterministic tools — MIRROR services/engine. Returns { result, attachment }.
// =============================================================================
const HIGH_INTEREST_PCT = 14;
const EMI_TENURE_MONTHS = 36;
const EMI_RATE_PCT = 11;
const OPPORTUNITY_YEARS = 5;

function runTool(name, args, context) {
  if (name === 'analyze_affordability') return analyzeAffordability(args, context);
  if (name === 'forecast_goal') return forecastGoal(args, context);
  return { result: { note: 'unknown tool' }, attachment: null };
}

function investReturnPct(ctx) {
  const a = ctx.financials.assumptions ?? { expectedReturnEquityPct: 12, expectedReturnDebtPct: 7 };
  switch (ctx.profile?.riskProfile) {
    case 'aggressive':
      return a.expectedReturnEquityPct;
    case 'conservative':
      return (a.expectedReturnEquityPct + a.expectedReturnDebtPct) / 2;
    default:
      return (a.expectedReturnEquityPct * 2 + a.expectedReturnDebtPct) / 3;
  }
}

/** Faithful port of evaluateDecision (services/engine/decision.ts). */
function analyzeAffordability(args, ctx) {
  const f = ctx.financials;
  const cost = Number(args.cost_paise ?? 0);
  const financing = args.financing === 'emi' ? 'emi' : 'cash';
  const item = args.item ?? 'this purchase';
  const surplus = Math.max(0, f.monthlySurplusPaise);
  const monthlyEmi = emi(cost, EMI_RATE_PCT, EMI_TENURE_MONTHS);
  const monthsToSave = surplus > 0 ? Math.ceil(cost / surplus) : Infinity;
  const emiShare = surplus > 0 ? monthlyEmi / surplus : Infinity;

  const freeCash = Math.max(0, f.totalSavingsPaise - f.emergencyFundPaise);
  const dipsIntoEmergency = financing === 'cash' && cost > freeCash;

  // Confidence (mirror scoreConfidence).
  let confidence = 85;
  if (surplus <= 0) confidence = 5;
  else if (financing === 'cash') {
    if (monthsToSave > 18) confidence -= 45;
    else if (monthsToSave > 12) confidence -= 30;
    else if (monthsToSave > 6) confidence -= 15;
    if (dipsIntoEmergency) confidence -= 35;
  } else {
    if (emiShare > 0.6) confidence -= 50;
    else if (emiShare > 0.4) confidence -= 30;
    else if (emiShare > 0.25) confidence -= 12;
    confidence -= 8;
  }
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));
  const verdict = confidence >= 70 ? 'go' : confidence >= 45 ? 'caution' : 'wait';

  const r = investReturnPct(ctx);
  const fvIfInvested = Math.round(cost * Math.pow(1 + r / 100 / 12, OPPORTUNITY_YEARS * 12));

  const result = {
    item,
    cost_inr: cost / 100,
    financing,
    verdict,
    confidence,
    monthly_surplus_inr: surplus / 100,
    months_to_save_cash: Number.isFinite(monthsToSave) ? monthsToSave : null,
    emi_36m_inr: monthlyEmi / 100,
    emi_share_of_surplus_pct: Number.isFinite(emiShare) ? Math.round(emiShare * 100) : null,
    dips_into_emergency_fund: dipsIntoEmergency,
    opportunity_cost_5y_inr: (fvIfInvested - cost) / 100,
    assumptions: [
      `Consumer EMI modelled at ${EMI_RATE_PCT}% p.a. over ${EMI_TENURE_MONTHS} months.`,
      `Opportunity cost modelled at ${Math.round(r)}% p.a. for ${OPPORTUNITY_YEARS} years (${ctx.profile?.riskProfile ?? 'balanced'} profile).`,
    ],
  };

  return {
    result,
    attachment: { type: 'affordability', title: `Can you afford ${item}?`, data: result },
  };
}

/** Faithful port of monthsToTarget for a named goal. */
function forecastGoal(args, ctx) {
  const goals = ctx.goals ?? [];
  const query = String(args.goal_name ?? '').toLowerCase();
  const goal =
    goals.find((g) => (g.name ?? '').toLowerCase().includes(query)) ??
    goals.find((g) => (g.type ?? '').toLowerCase().includes(query));
  if (!goal) {
    return { result: { note: 'no matching goal', goals: goals.map((g) => g.name) }, attachment: null };
  }
  const r = (ctx.financials.assumptions?.expectedReturnEquityPct ?? 12) / 100 / 12;
  const monthly = Math.max(1, goal.monthlyContributionPaise ?? 0);
  let corpus = goal.currentAmountPaise ?? 0;
  let months = 600;
  for (let m = 1; m <= 600; m += 1) {
    corpus = corpus * (1 + r) + monthly;
    if (corpus >= (goal.targetAmountPaise ?? 0)) {
      months = m;
      break;
    }
  }
  const result = {
    goal: goal.name,
    months_to_reach: months,
    years_to_reach: Math.round((months / 12) * 10) / 10,
    monthly_contribution_inr: monthly / 100,
    target_inr: (goal.targetAmountPaise ?? 0) / 100,
    saved_inr: (goal.currentAmountPaise ?? 0) / 100,
  };
  return {
    result,
    attachment: { type: 'goal_forecast', title: `${goal.name} forecast`, data: result },
  };
}

function emi(principal, annualRatePct, months) {
  if (months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

// --- Context blocks (mirror services/ai/prompts.ts) -------------------------
function inr(paise) {
  return `₹${Math.round((paise ?? 0) / 100).toLocaleString('en-IN')}`;
}

function buildFinancialContext(ctx) {
  const f = ctx.financials;
  const goals = (ctx.goals ?? [])
    .map(
      (g) =>
        `  - ${g.name} (${g.type}): target ${inr(g.targetAmountPaise)}, saved ${inr(
          g.currentAmountPaise,
        )}, priority ${g.priority}`,
    )
    .join('\n');
  const debts = (ctx.debts ?? [])
    .map(
      (d) => `  - ${d.type}: ${inr(d.principalOutstandingPaise)} outstanding @ ${d.interestRate ?? '?'}%, EMI ${inr(d.emiPaise)}`,
    )
    .join('\n');

  return `FINANCIAL_CONTEXT (the user's real data — use ONLY these numbers):
- Name: ${ctx.profile?.displayName || 'User'}, age ${ctx.profile?.age ?? 'unknown'}
- Risk profile: ${ctx.profile?.riskProfile}; Tax regime: ${ctx.profile?.taxRegime}
- Monthly in-hand income: ${inr(f.monthlyIncomePaise)}
- Monthly expenses: ${inr(f.totalExpensesPaise)}
- Monthly surplus: ${inr(f.monthlySurplusPaise)}
- Savings: ${inr(f.totalSavingsPaise)} | Investments: ${inr(f.totalInvestmentsPaise)} | Debt: ${inr(f.totalDebtPaise)}
- Emergency fund: ${inr(f.emergencyFundPaise)} (target ${f.emergencyMonthsTarget} months)
- Net worth: ${inr(f.netWorthPaise)}
- Financial Health Score: ${ctx.scores?.healthScore ?? 'n/a'}/100; Wealth Velocity: ${ctx.scores?.velocityScore ?? 'n/a'}/100
Goals:
${goals || '  (none yet)'}
Debts:
${debts || '  (none)'}`;
}

/** Lightweight server-side advisory signals (mirror the client action plan). */
function advisorySignals(ctx) {
  const f = ctx.financials;
  const income = Math.max(1, f.monthlyIncomePaise);
  const lines = ['ADVISORY_SIGNALS (engine-computed — narrate, do not recompute):'];

  const expensive = (ctx.debts ?? [])
    .filter((d) => (d.interestRate ?? 0) >= HIGH_INTEREST_PCT && d.principalOutstandingPaise > 0)
    .sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
  if (expensive.length) {
    const d = expensive[0];
    const annualInterest = Math.round((d.principalOutstandingPaise * (d.interestRate ?? 0)) / 100);
    lines.push(`- Biggest mistake: ${d.interestRate}% debt draining ~${inr(annualInterest)}/yr — clear it first.`);
  }

  const savingsRate = (f.monthlySurplusPaise / income) * 100;
  if (savingsRate < 15) {
    lines.push(`- Savings rate is ${Math.round(savingsRate)}% — below the 15% floor. Lifting it toward 20% is the priority.`);
  }

  const emergencyGap = Math.max(0, (f.totalExpensesPaise * f.emergencyMonthsTarget) - f.emergencyFundPaise);
  if (emergencyGap > 0) {
    lines.push(`- Emergency fund gap of ${inr(emergencyGap)} to reach ${f.emergencyMonthsTarget} months.`);
  }

  if (lines.length === 1) lines.push('- Fundamentals look solid; focus on stepping up SIPs at the next raise.');
  return lines.join('\n');
}

const TOOL_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'analyze_affordability',
      description:
        'Decide if the user can afford a purchase using their real finances. Returns verdict, confidence, cash-flow strain, EMI, emergency-fund impact and 5-year opportunity cost. Call for any "can I afford / should I buy" question.',
      parameters: {
        type: 'object',
        properties: {
          item: { type: 'string' },
          cost_paise: { type: 'integer', description: 'Cost in paise (rupees x 100)' },
          financing: { type: 'string', enum: ['cash', 'emi'] },
        },
        required: ['item', 'cost_paise'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'forecast_goal',
      description:
        'Estimate months/years until a named goal is reached at the current monthly contribution. Call for "how long until / when can I afford <goal>" questions.',
      parameters: {
        type: 'object',
        properties: { goal_name: { type: 'string' } },
        required: ['goal_name'],
      },
    },
  },
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
