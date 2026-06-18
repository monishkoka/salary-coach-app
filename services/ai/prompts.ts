/**
 * Prompt architecture for the AI Coach.
 *
 * Layering (assembled in this order before sending to the model):
 *   1. SYSTEM_PROMPT      — role, tone, hard rules (static).
 *   2. POLICY_PROMPT      — compliance + scope guardrails (static).
 *   3. financialContext() — the user's real numbers + engine outputs (dynamic).
 *   4. conversation memory summary (dynamic, injected by the orchestrator).
 *   5. the user's message.
 *
 * Golden rule encoded everywhere: the model NEVER invents numbers. Any figure
 * must come from the financial context block or a tool result.
 */

import type { AIContext } from '@/types';
import { formatINR, formatINRCompact } from '@/utils/currency';
import { buildActionPlan, buildMoneyGps } from '@/services/engine';

export const SYSTEM_PROMPT = `You are "Coach", a calm, expert personal CFO for salaried professionals in India.

Your job is to tell the user exactly what to do with their money and explain why, like a trusted advisor who knows their full situation.

Tone & style:
- Warm, confident, encouraging. Never condescending, never shaming.
- Concise. Lead with the answer, then a one or two line "why".
- Use Indian rupee formatting (₹, lakh/crore) and Indian financial instruments (EPF, PPF, NPS, ELSS, SIP, FD, 80C, term insurance).
- Always show the trade-off when relevant (e.g. "yes, but it delays your home goal by 8 months").

Hard rules:
- NEVER invent or estimate specific numbers. Only use figures present in FINANCIAL_CONTEXT or returned by a tool. If you lack a number, say so.
- NEVER recommend specific stocks, mutual fund names, or market timing. Speak in categories (index funds, debt funds, ELSS).
- Surface key assumptions and remind the user this is educational guidance, not SEBI-registered advice, when giving investment direction.
- Keep answers under ~120 words unless the user asks for depth.`;

export const POLICY_PROMPT = `Scope & compliance:
- You provide educational financial coaching, not regulated investment advice.
- Decline politely if asked for specific securities, guaranteed returns, tax evasion, or anything illegal.
- For complex tax/legal/insurance specifics, recommend consulting a qualified professional.
- Be especially careful and supportive with users in financial stress; prioritize emergency fund and high-interest debt.`;

export function financialContext(ctx: AIContext): string {
  const f = ctx.financials;
  const goals = ctx.goals
    .map(
      (g) =>
        `  - ${g.name} (${g.type}): target ${formatINR(g.targetAmountPaise)}, saved ${formatINR(
          g.currentAmountPaise,
        )}, priority ${g.priority}`,
    )
    .join('\n');
  const debts = ctx.debts
    .map(
      (d) =>
        `  - ${d.type}: ₹${(d.principalOutstandingPaise / 100).toFixed(0)} outstanding @ ${
          d.interestRate ?? '?'
        }%, EMI ${formatINR(d.emiPaise)}`,
    )
    .join('\n');

  return `FINANCIAL_CONTEXT (the user's real data — use ONLY these numbers):
- Name: ${ctx.profile.displayName || 'User'}, age ${ctx.profile.age ?? 'unknown'}
- Risk profile: ${ctx.profile.riskProfile}; Tax regime: ${ctx.profile.taxRegime}
- Monthly in-hand income: ${formatINR(f.monthlyIncomePaise)}
- Monthly essential expenses: ${formatINR(f.totalExpensesPaise)}
- Monthly surplus: ${formatINR(f.monthlySurplusPaise)}
- Savings: ${formatINR(f.totalSavingsPaise)} | Investments: ${formatINR(
    f.totalInvestmentsPaise,
  )} | Debt: ${formatINR(f.totalDebtPaise)}
- Emergency fund: ${formatINR(f.emergencyFundPaise)} (target ${f.emergencyMonthsTarget} months)
- Net worth: ${formatINR(f.netWorthPaise)}
- Financial Health Score: ${ctx.scores?.healthScore ?? 'n/a'}/100; Wealth Velocity: ${
    ctx.scores?.velocityScore ?? 'n/a'
  }/100
Goals:
${goals || '  (none yet)'}
Debts:
${debts || '  (none)'}

${advisorySignals(ctx)}`;
}

/**
 * Engine-derived advisory signals. The deterministic engine has already worked
 * out the user's biggest mistake, biggest opportunity, prioritized next actions,
 * and optimal route — so we hand those to the model as grounded talking points.
 * This is what makes the coach feel like a CFO who already knows the plan rather
 * than a chatbot starting from a blank page. The model must not invent new
 * numbers; it narrates and prioritizes these.
 */
export function advisorySignals(ctx: AIContext): string {
  if (!ctx.financials) return '';
  const plan = buildActionPlan(ctx);
  const gps = buildMoneyGps(ctx);

  const lines: string[] = ['ADVISORY_SIGNALS (engine-computed — narrate, do not recompute):'];
  if (plan.biggestMistake) {
    lines.push(
      `- Biggest mistake: ${plan.biggestMistake.title} — ${plan.biggestMistake.costLabel}.`,
    );
  }
  if (plan.biggestOpportunity) {
    lines.push(
      `- Biggest opportunity: ${plan.biggestOpportunity.title} — ${plan.biggestOpportunity.upsideLabel}.`,
    );
  }
  const top = plan.items.slice(0, 3);
  if (top.length) {
    lines.push('- Prioritized next actions:');
    top.forEach((item, i) => {
      const amt = item.amountPaise ? ` (${formatINRCompact(item.amountPaise)})` : '';
      lines.push(`  ${i + 1}. ${item.title}${amt} — ${item.impactLabel}.`);
    });
  }
  lines.push(`- Route correction: ${gps.correction}`);
  return lines.join('\n');
}

/** Tool descriptions exposed to the model (function-calling). */
export const TOOL_DEFINITIONS = [
  {
    name: 'analyze_affordability',
    description:
      'Determine if the user can afford a purchase. Returns verdict, monthly impact, months to save, EMI, and goal delay. Call this for any "can I afford / should I buy" question.',
    parameters: {
      type: 'object',
      properties: {
        item: { type: 'string', description: 'What they want to buy, e.g. "a car"' },
        cost_paise: { type: 'integer', description: 'Cost in paise (rupees x 100)' },
        financing: { type: 'string', enum: ['cash', 'emi'] },
      },
      required: ['item', 'cost_paise'],
    },
  },
  {
    name: 'forecast_goal',
    description: 'Estimate months/years until a goal is reached at the current contribution.',
    parameters: {
      type: 'object',
      properties: { goal_name: { type: 'string' } },
      required: ['goal_name'],
    },
  },
] as const;

/** Prompt used by the deterministic-first blueprint narrator. */
export function blueprintNarrationPrompt(allocationsJson: string): string {
  return `${SYSTEM_PROMPT}\n\nThe engine produced this allocation for the user's next salary (JSON):\n${allocationsJson}\n\nWrite a 2-sentence, encouraging summary of this plan. Do not change any numbers.`;
}
