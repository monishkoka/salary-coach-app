/**
 * Supabase Edge Function: ai-coach
 *
 * Holds the OpenAI key server-side and runs the tool-calling loop. The mobile
 * app sends { context, messages, conversationSummary }; this function builds
 * the layered prompt, lets the model call deterministic tools, and returns a
 * grounded answer. Numbers always originate from tool results, never the model.
 *
 * Deploy:  supabase functions deploy ai-coach --no-verify-jwt=false
 * Secrets: supabase secrets set OPENAI_API_KEY=sk-...
 *
 * NOTE: This runs on Deno (Supabase Edge runtime), not React Native. It is
 * intentionally self-contained and does not import app code.
 */

// @ts-nocheck — Deno runtime, typed against the Edge environment, not RN.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const MODEL = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are "Coach", a calm, expert personal CFO for salaried professionals in India.
Lead with the answer, then a short why. Use ₹/lakh/crore and Indian instruments (EPF, PPF, NPS, ELSS, SIP, 80C).
NEVER invent numbers — only use FINANCIAL_CONTEXT or tool results. Never recommend specific securities or market timing.
This is educational guidance, not SEBI-registered advice. Keep answers under ~120 words.`;

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { context, messages, conversationSummary } = await req.json();

    const systemBlocks = [
      SYSTEM_PROMPT,
      conversationSummary ? `Conversation so far: ${conversationSummary}` : '',
      buildFinancialContext(context),
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
    return json({ error: String(err) }, 500);
  }
});

async function callOpenAI(messages, context) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages,
      tools: TOOL_SCHEMA,
    }),
  });
  const data = await res.json();
  const choice = data.choices?.[0]?.message;

  // Single-round tool handling: run the tool, feed result back, ask for prose.
  const toolCall = choice?.tool_calls?.[0];
  if (toolCall) {
    const args = JSON.parse(toolCall.function.arguments ?? '{}');
    const toolResult = runTool(toolCall.function.name, args, context);
    const followUp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        messages: [
          ...messages,
          choice,
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          },
        ],
      }),
    });
    const followData = await followUp.json();
    return {
      content: followData.choices?.[0]?.message?.content ?? '',
      attachments: [{ type: 'affordability', title: 'Analysis', data: toolResult }],
      toolName: toolCall.function.name,
    };
  }

  return { content: choice?.content ?? '', attachments: [], toolName: null };
}

// --- Deterministic tools (mirror services/engine on the server) -------------
function runTool(name, args, context) {
  if (name === 'analyze_affordability') {
    const cost = args.cost_paise;
    const surplus = Math.max(0, context.financials.monthlySurplusPaise);
    const monthsToSave = surplus > 0 ? Math.ceil(cost / surplus) : 999;
    const emi = monthlyEmi(cost, 11, 36);
    return {
      item: args.item,
      cost_inr: cost / 100,
      monthly_surplus_inr: surplus / 100,
      months_to_save_cash: monthsToSave,
      emi_36m_inr: emi / 100,
      verdict: monthsToSave <= 6 ? 'comfortable' : monthsToSave <= 18 ? 'tight' : 'not_yet',
    };
  }
  return { note: 'unknown tool' };
}

function monthlyEmi(principal, annualRatePct, months) {
  const r = annualRatePct / 100 / 12;
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

function buildFinancialContext(ctx) {
  const f = ctx.financials;
  return `FINANCIAL_CONTEXT (use ONLY these numbers):
income ₹${f.monthlyIncomePaise / 100}/mo, expenses ₹${f.totalExpensesPaise / 100}/mo,
surplus ₹${f.monthlySurplusPaise / 100}/mo, savings ₹${f.totalSavingsPaise / 100},
investments ₹${f.totalInvestmentsPaise / 100}, debt ₹${f.totalDebtPaise / 100},
emergency fund ₹${f.emergencyFundPaise / 100} (target ${f.emergencyMonthsTarget} months),
risk ${ctx.profile.riskProfile}, tax regime ${ctx.profile.taxRegime},
health score ${ctx.scores?.healthScore ?? 'n/a'}, velocity ${ctx.scores?.velocityScore ?? 'n/a'}.
Goals: ${(ctx.goals ?? []).map((g) => `${g.name}(${g.type})`).join(', ') || 'none'}.`;
}

const TOOL_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'analyze_affordability',
      description: 'Decide if the user can afford a purchase using their real finances.',
      parameters: {
        type: 'object',
        properties: {
          item: { type: 'string' },
          cost_paise: { type: 'integer' },
          financing: { type: 'string', enum: ['cash', 'emi'] },
        },
        required: ['item', 'cost_paise'],
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
