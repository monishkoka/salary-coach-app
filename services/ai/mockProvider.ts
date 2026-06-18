/**
 * Local mock provider used when no backend is configured (config.useMockData)
 * or for demos. It still produces grounded, numeric answers by running the
 * SAME deterministic engine tools the real Edge Function would call — so the
 * coaching feels real even fully offline.
 */

import { buildActionPlan, buildMoneyGps, evaluateDecision } from '@/services/engine';
import { formatINR, formatINRCompact, parseRupeeInput } from '@/utils/currency';
import { monthsToTarget } from '@/utils/finance';
import { useMemoryStore } from '@/store/memoryStore';
import type { AIContext } from '@/types';
import type {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './provider';

export class MockProvider implements AIProvider {
  readonly id = 'mock';

  async chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    await delay(450); // emulate latency for realistic UX
    const last = req.messages[req.messages.length - 1]?.content.toLowerCase() ?? '';
    const ctx = req.context;

    // Decision intent (affordability) ---------------------------------------
    if (/(afford|buy|purchase|iphone|car|laptop|phone|should i (get|buy))/.test(last)) {
      const cost = extractCost(last) ?? guessCost(last);
      const item = guessItem(last);
      const financing = /emi|loan|instal/.test(last) ? 'emi' : 'cash';
      const d = evaluateDecision(ctx, item, cost, financing);

      const impactLines = d.impacts
        .filter((i) => i.severity !== 'neutral')
        .map((i) => `• ${i.label}: ${i.detail}`)
        .join('\n');
      const altText = d.alternatives.length
        ? `\n\nSmarter options:\n${d.alternatives.map((a) => `• ${a.title} — ${a.detail}`).join('\n')}`
        : '';
      const why = `\n\nWhy I'm ${d.confidence}% confident: ${d.trust.reasoning[d.trust.reasoning.length - 1]}`;

      return {
        content: `${d.headline}\n\n${impactLines}${altText}${why}`,
        attachments: [
          {
            type: 'affordability',
            title: `Decision: ${item} — ${verdictLabel(d.verdict)} (${d.confidence}%)`,
            data: d.details,
          },
        ],
        toolName: 'evaluate_decision',
      };
    }

    // Financial memory intent -----------------------------------------------
    if (/(progress|improv|how have i|compared to|my history|remember|over time|getting better|my trend|consistent)/.test(last)) {
      const mem = memoryResponse(ctx);
      if (mem) return mem;
    }

    // House timeline intent -------------------------------------------------
    if (/(house|home|flat|apartment)/.test(last) && /(how long|when|buy)/.test(last)) {
      const goal = ctx.goals.find((g) => g.type === 'house');
      if (goal) {
        const months = monthsToTarget(
          goal.targetAmountPaise,
          goal.currentAmountPaise,
          goal.monthlyContributionPaise,
          ctx.profile.riskProfile === 'aggressive' ? 12 : 10,
        );
        const yrs = (months / 12).toFixed(1);
        return {
          content: `At your current pace (${formatINRCompact(
            goal.monthlyContributionPaise,
          )}/month toward "${goal.name}"), you're about ${yrs} years away from ${formatINR(
            goal.targetAmountPaise,
          )}. Raising your monthly contribution by even ${formatINRCompact(
            500000,
          )} would meaningfully shorten that.`,
        };
      }
    }

    // "What should I do / where do I start / priorities" --------------------
    if (/(what should i do|where (do|should) i (start|begin)|priorit|next step|my plan|focus on|fix first)/.test(last)) {
      return planResponse(ctx);
    }

    // "Am I on track / how am I doing / financial health" -------------------
    if (/(on track|how am i (doing|going)|am i (ok|okay|fine|good)|my (health|score)|doing well|behind)/.test(last)) {
      return statusResponse(ctx);
    }

    // "How do I improve / save faster / optimize / get ahead" ---------------
    if (/(improve|optimi|save faster|get ahead|do better|reach.*faster|sooner|better route)/.test(last)) {
      return improveResponse(ctx);
    }

    // Invest amount intent --------------------------------------------------
    if (/(how much).*(invest|save|sip)/.test(last)) {
      const suggested = Math.round(ctx.financials.monthlySurplusPaise * 0.65);
      return {
        content: `Based on your ${formatINR(
          ctx.financials.monthlySurplusPaise,
        )} monthly surplus, aim to invest about ${formatINR(
          suggested,
        )} each month — roughly 65% of your surplus. Keep the rest flexible for goals and life. For your ${
          ctx.profile.riskProfile
        } profile, a mix of index funds and ${
          ctx.profile.taxRegime === 'old' ? 'ELSS (for 80C) and PPF' : 'debt funds'
        } fits well. (Educational guidance, not regulated advice.)`,
      };
    }

    // Vacation intent -------------------------------------------------------
    if (/vacation|trip|travel|holiday/.test(last)) {
      const cost = extractCost(last) ?? 15000000;
      const d = evaluateDecision(ctx, 'this vacation', cost, 'cash');
      return { content: d.headline };
    }

    // Fallback: lead like a CFO with the single most important next move. ----
    const plan = buildActionPlan(ctx);
    const top = plan.items[0];
    const lead = top
      ? `Here's where I'd focus first: ${top.title}${
          top.amountPaise ? ` (${formatINRCompact(top.amountPaise)})` : ''
        } — ${top.impactLabel}.`
      : `Your fundamentals look solid — keep your SIPs automated and step them up at your next appraisal.`;
    return {
      content: `${lead}\n\nQuick picture: ${formatINR(
        ctx.financials.monthlyIncomePaise,
      )}/month in, ${formatINR(
        ctx.financials.monthlySurplusPaise,
      )} surplus, Health Score ${
        ctx.scores?.healthScore ?? '—'
      }/100. Ask me "What should I do first?", "Am I on track?", "Can I afford a ₹12L car?", or "How much should I invest?"`,
    };
  }
}

function verdictLabel(verdict: 'go' | 'caution' | 'wait'): string {
  return verdict === 'go' ? 'Go for it' : verdict === 'caution' ? 'Proceed carefully' : 'Hold off';
}

/** "How am I improving?" — narrate the user's real financial memory. */
function memoryResponse(_ctx: AIContext): ChatCompletionResponse | null {
  const narrative = useMemoryStore.getState().narrative();
  if (!narrative) return null;
  const body = narrative.details.length ? `\n\n${narrative.details.join('\n')}` : '';
  return {
    content: `${narrative.headline}${body}\n\nI track this every month, so I'll always tell you the truth about your trajectory — not just how today looks.`,
    toolName: 'recall_history',
  };
}

/** "What should I do?" — narrate the engine's prioritized action plan. */
function planResponse(ctx: AIContext): ChatCompletionResponse {
  const plan = buildActionPlan(ctx);
  const top = plan.items.slice(0, 3);
  if (!top.length) {
    return {
      content:
        "You're in good shape — no urgent fixes. Keep your investments automated and step up your SIP ~10% at every appraisal to keep compounding working for you.",
    };
  }
  const steps = top
    .map((item, i) => {
      const amt = item.amountPaise ? ` ${formatINRCompact(item.amountPaise)}` : '';
      return `${i + 1}. ${item.title}${amt} — ${item.impactLabel}.`;
    })
    .join('\n');
  const mistake = plan.biggestMistake
    ? `\n\nThe one thing quietly costing you the most: ${plan.biggestMistake.title} (${plan.biggestMistake.costLabel}).`
    : '';
  return {
    content: `Here's your prioritized plan, in order of impact:\n\n${steps}${mistake}\n\nStart at the top — each step funds the next.`,
  };
}

/** "Am I on track?" — health + velocity + biggest opportunity. */
function statusResponse(ctx: AIContext): ChatCompletionResponse {
  const plan = buildActionPlan(ctx);
  const health = ctx.scores?.healthScore;
  const velocity = ctx.scores?.velocityScore;
  const verdict =
    health == null
      ? 'I need your full picture to grade this.'
      : health >= 75
        ? "You're genuinely on track — strong fundamentals."
        : health >= 50
          ? "You're doing okay, with clear room to pull ahead."
          : 'There are a few important gaps to close, but they are all fixable.';
  const opp = plan.biggestOpportunity
    ? ` Your biggest lever right now: ${plan.biggestOpportunity.title} — ${plan.biggestOpportunity.upsideLabel}.`
    : '';
  return {
    content: `${verdict} Your Financial Health Score is ${health ?? '—'}/100 and your Wealth Velocity is ${
      velocity ?? '—'
    }/100 (how fast you're moving toward independence).${opp}`,
  };
}

/** "How do I improve?" — narrate the Money GPS route correction. */
function improveResponse(ctx: AIContext): ChatCompletionResponse {
  const gps = buildMoneyGps(ctx);
  const plan = buildActionPlan(ctx);
  const move = plan.items[0]
    ? ` The highest-impact move is to ${plan.items[0]!.title.toLowerCase()} — ${plan.items[0]!.impactLabel}.`
    : '';
  return {
    content: `${gps.correction}${move} Small, consistent changes compound — even a modest monthly step-up meaningfully changes your 10-year picture.`,
  };
}

function extractCost(text: string): number | null {
  // Matches "12l", "₹1.2 lakh", "50,000", "5 crore"
  const m = text.match(/₹?\s?[\d,.]+\s?(cr|crore|l|lakh|lakhs|k|thousand)?/i);
  if (!m || !m[0]) return null;
  const normalized = m[0]
    .replace(/lakhs?/i, 'l')
    .replace(/crore/i, 'cr')
    .replace(/thousand/i, 'k');
  const paise = parseRupeeInput(normalized);
  return paise > 0 ? paise : null;
}

function guessCost(text: string): number {
  if (/iphone|phone/.test(text)) return 13000000; // ₹1.3L
  if (/car/.test(text)) return 120000000; // ₹12L
  if (/laptop/.test(text)) return 9000000; // ₹90k
  return 5000000; // ₹50k default
}

function guessItem(text: string): string {
  if (/iphone/.test(text)) return 'the new iPhone';
  if (/car/.test(text)) return 'a car';
  if (/laptop/.test(text)) return 'a laptop';
  if (/phone/.test(text)) return 'a new phone';
  return 'this purchase';
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
