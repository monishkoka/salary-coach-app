/**
 * Domain types for Salary Coach AI.
 *
 * Money convention: every `*_paise` field is an integer number of paise
 * (1 rupee = 100 paise). UI formatting helpers in utils/currency.ts convert
 * to/from rupees. Never store money as a float.
 */

// -----------------------------------------------------------------------------
// Enums / unions (mirror the SQL enums in supabase/migrations/0001_init.sql)
// -----------------------------------------------------------------------------
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
export type TaxRegime = 'old' | 'new';
export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'enterprise';

export type IncomeType = 'salary' | 'bonus' | 'variable' | 'rental' | 'other';
export type Cadence = 'monthly' | 'quarterly' | 'annual' | 'one_time';

export type ExpenseCategory =
  | 'rent'
  | 'emi'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'subscriptions'
  | 'family_support'
  | 'health'
  | 'discretionary'
  | 'other';

export type SavingsBucket = 'liquid' | 'emergency' | 'goal_linked' | 'fd' | 'rd' | 'other';

export type AssetClass =
  | 'mf'
  | 'equity'
  | 'epf'
  | 'ppf'
  | 'nps'
  | 'fd'
  | 'rd'
  | 'gold'
  | 'esop'
  | 'rsu'
  | 'real_estate'
  | 'crypto'
  | 'other';

export type DebtType =
  | 'home'
  | 'car'
  | 'personal'
  | 'education'
  | 'credit_card'
  | 'bnpl'
  | 'other';

export type GoalType =
  | 'emergency'
  | 'house'
  | 'car'
  | 'marriage'
  | 'vacation'
  | 'child_education'
  | 'retirement'
  | 'business'
  | 'debt_free'
  | 'custom';

export type GoalStatus = 'on_track' | 'at_risk' | 'achieved' | 'paused';

export type RecommendationCategory =
  | 'debt'
  | 'emergency'
  | 'investment'
  | 'tax'
  | 'savings'
  | 'spending_limit'
  | 'goal'
  | 'insurance'
  | 'behavior';

export type RecommendationStatus =
  | 'suggested'
  | 'accepted'
  | 'dismissed'
  | 'done'
  | 'snoozed';

export type ConversationMode = 'chat' | 'command_center';
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// -----------------------------------------------------------------------------
// Core entities
// -----------------------------------------------------------------------------
export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
  age: number | null;
  maritalStatus: string | null;
  dependents: Record<string, number>;
  riskProfile: RiskProfile;
  salaryDnaArchetype: string | null;
  taxRegime: TaxRegime;
  payDayOfMonth: number | null;
  city: string | null;
  subscriptionTier: SubscriptionTier;
  onboardingCompletedAt: string | null;
  currency: string;
}

export interface FinancialProfile {
  id: string;
  userId: string;
  monthlyIncomePaise: number;
  expectedGrowthPct: number;
  totalExpensesPaise: number;
  totalSavingsPaise: number;
  totalInvestmentsPaise: number;
  totalDebtPaise: number;
  emergencyMonthsTarget: number;
  emergencyFundPaise: number;
  monthlySurplusPaise: number;
  netWorthPaise: number;
  assumptions: ProfileAssumptions;
}

export interface ProfileAssumptions {
  expectedReturnEquityPct: number;
  expectedReturnDebtPct: number;
  inflationPct: number;
  salaryGrowthPct: number;
  retirementAge: number;
}

export interface Expense {
  id: string;
  userId: string;
  category: ExpenseCategory;
  label: string | null;
  amountPaise: number;
  isEssential: boolean;
  isRecurring: boolean;
  period: Cadence;
}

export interface Income {
  id: string;
  userId: string;
  type: IncomeType;
  amountPaise: number;
  isInHand: boolean;
  frequency: Cadence;
  expectedGrowthPct: number;
  sourceLabel: string | null;
}

export interface SavingsAccount {
  id: string;
  userId: string;
  bucket: SavingsBucket;
  label: string | null;
  amountPaise: number;
  goalId: string | null;
  interestRate: number | null;
}

export interface Investment {
  id: string;
  userId: string;
  assetClass: AssetClass;
  instrumentName: string | null;
  currentValuePaise: number;
  investedValuePaise: number;
  sipAmountPaise: number | null;
  sipDay: number | null;
  expectedReturnPct: number | null;
}

export interface Debt {
  id: string;
  userId: string;
  type: DebtType;
  label: string | null;
  principalOutstandingPaise: number;
  emiPaise: number;
  interestRate: number | null;
  tenureMonthsRemaining: number | null;
  dueDay: number | null;
}

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  name: string;
  icon: string | null;
  targetAmountPaise: number;
  currentAmountPaise: number;
  targetDate: string | null;
  priority: number;
  monthlyContributionPaise: number;
  probabilityOfSuccess: number | null;
  status: GoalStatus;
}

// -----------------------------------------------------------------------------
// Blueprint, scores, recommendations
// -----------------------------------------------------------------------------
export type AllocationKey =
  | 'needs'
  | 'emergency'
  | 'debt'
  | 'investments'
  | 'goals'
  | 'lifestyle'
  | 'tax';

export interface AllocationLine {
  key: AllocationKey;
  label: string;
  amountPaise: number;
  pct: number;
  rationale: string;
  /** Optional per-goal breakdown for the "goals" bucket. */
  breakdown?: { label: string; amountPaise: number }[];
}

export interface SalaryBlueprint {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string | null;
  incomePaise: number;
  allocations: AllocationLine[];
  summary: string;
  actionsTotal: number;
  actionsDone: number;
  generatedBy: 'engine' | 'ai';
}

export interface HealthSubScores {
  savingsRate: number;
  debtRatio: number;
  emergencyFund: number;
  goalProgress: number;
  diversification: number;
  /** Lifestyle Control: how contained discretionary spend is vs income. */
  lifestyleControl: number;
  /** Investment Discipline: recurring/SIP investment rate consistency. */
  investmentDiscipline: number;
}

export interface VelocityFactors {
  goalProgress: number;
  savingsConsistency: number;
  investmentRate: number;
  netWorthGrowth: number;
}

export interface FinancialScores {
  id: string;
  userId: string;
  healthScore: number;
  healthSubScores: HealthSubScores;
  velocityScore: number;
  velocityFactors: VelocityFactors;
  projectedFiDate: string | null;
  computedAt: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  blueprintId: string | null;
  category: RecommendationCategory;
  title: string;
  body: string;
  amountPaise: number | null;
  rationale: Record<string, unknown>;
  impactEstimate: Record<string, unknown>;
  priority: number;
  status: RecommendationStatus;
}

// -----------------------------------------------------------------------------
// AI / coach
// -----------------------------------------------------------------------------
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolName?: string | null;
  createdAt: string;
  /** Optional structured data the UI can render (chips, mini-charts, CTAs). */
  attachments?: ChatAttachment[];
  pending?: boolean;
}

export interface ChatAttachment {
  type: 'affordability' | 'scenario' | 'goal_forecast' | 'cta';
  title: string;
  data: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  userId: string;
  mode: ConversationMode;
  title: string | null;
  summary: string | null;
  lastMessageAt: string;
}

// -----------------------------------------------------------------------------
// Insights
// -----------------------------------------------------------------------------
export type InsightTheme =
  | 'spending'
  | 'savings'
  | 'salary'
  | 'wealth'
  | 'behavior'
  | 'forecast';

export interface Insight {
  id: string;
  theme: InsightTheme;
  headline: string;
  body: string;
  /** -1 negative, 0 neutral, 1 positive — drives accent color. */
  sentiment: -1 | 0 | 1;
  series?: { label: string; value: number }[];
  createdAt: string;
}

// -----------------------------------------------------------------------------
// AI service contracts
// -----------------------------------------------------------------------------
export interface AIContext {
  profile: UserProfile;
  financials: FinancialProfile;
  goals: Goal[];
  expenses: Expense[];
  debts: Debt[];
  investments: Investment[];
  scores: FinancialScores | null;
}

export interface BlueprintRequest {
  context: AIContext;
  periodStart: string;
}

export interface AffordabilityRequest {
  context: AIContext;
  item: string;
  costPaise: number;
  financing?: 'cash' | 'emi';
}

// -----------------------------------------------------------------------------
// Trust Engine — every recommendation carries its reasoning, confidence,
// assumptions and risks so the user never wonders "why is the app telling me
// this?". Attached to decisions, routes and projections.
// -----------------------------------------------------------------------------
export interface Trust {
  /** Plain-language explanation of how the conclusion was reached. */
  reasoning: string[];
  /** 0–100 confidence in the recommendation given data completeness + margins. */
  confidence: number;
  /** The explicit modelling assumptions (returns, inflation, tenure, etc.). */
  assumptions: string[];
  /** What could make this recommendation wrong. */
  risks: string[];
}

// -----------------------------------------------------------------------------
// Decision Engine — multi-dimensional "should I do X?" analysis. Powers the
// affordability/decision coach tool with a confidence score, dimension-by-
// dimension impact, alternatives and a full Trust breakdown.
// -----------------------------------------------------------------------------
export type DecisionVerdict = 'go' | 'caution' | 'wait';
export type ImpactSeverity = 'positive' | 'neutral' | 'minor' | 'moderate' | 'severe';

export interface DecisionImpact {
  key: 'cash_flow' | 'goals' | 'emergency' | 'investments' | 'opportunity_cost';
  label: string;
  severity: ImpactSeverity;
  /** One-line human summary, e.g. "Pushes your home goal out by 7 months". */
  detail: string;
  /** Signed paise effect where meaningful (negative = costs you), else null. */
  valuePaise: number | null;
}

export interface DecisionAlternative {
  title: string;
  detail: string;
  /** Optional cheaper/smarter price point in paise. */
  amountPaise: number | null;
}

export interface Decision {
  item: string;
  costPaise: number;
  financing: 'cash' | 'emi';
  verdict: DecisionVerdict;
  /** 0–100: how confidently the engine endorses going ahead now. */
  confidence: number;
  headline: string;
  /** The four+ dimensions a real advisor would weigh. */
  impacts: DecisionImpact[];
  alternatives: DecisionAlternative[];
  /** Reasoning / assumptions / risks behind the verdict. */
  trust: Trust;
  /** Flat key/value detail map for compact attachment rendering. */
  details: Record<string, string | number>;
}

export interface DecisionRequest {
  context: AIContext;
  item: string;
  costPaise: number;
  financing?: 'cash' | 'emi';
}

// -----------------------------------------------------------------------------
// Financial Memory — persistent longitudinal record of the user's trajectory.
// Snapshots are captured over time so the coach can reference real history
// ("3 months ago you saved 12%, today 21%").
// -----------------------------------------------------------------------------
export interface FinancialSnapshot {
  /** Calendar month the snapshot represents (YYYY-MM). One per month. */
  month: string;
  capturedAt: string;
  healthScore: number;
  velocityScore: number;
  savingsRatePct: number;
  sipRatePct: number;
  netWorthPaise: number;
  emergencyMonths: number;
  totalDebtPaise: number;
  goalsOnTrack: number;
}

export type MemoryTrend = 'improving' | 'steady' | 'slipping';

export interface MemoryNarrative {
  /** Headline insight referencing real history, e.g. progress on savings rate. */
  headline: string;
  /** Supporting one-liners (habit changes, milestones, streaks). */
  details: string[];
  trend: MemoryTrend;
  /** Months of history the narrative is grounded in. */
  spanMonths: number;
}

// -----------------------------------------------------------------------------
// Forecasting: Money GPS + Future Self Simulator
// -----------------------------------------------------------------------------

/** A single sampled point on a projected trajectory. */
export interface ProjectionPoint {
  month: number; // months from now (0 = today)
  netWorthPaise: number;
  savingsPaise: number;
  investmentsPaise: number;
}

export type ScenarioId =
  | 'current'
  | 'save_more'
  | 'invest_aggressive'
  | 'reduce_lifestyle'
  | 'salary_jump';

/** Forecast horizons. `retirement` is dynamic (to the user's retirement age). */
export type HorizonKey = 'y1' | 'y3' | 'y5' | 'y10' | 'y15' | 'retirement';

export interface ScenarioProjection {
  id: ScenarioId;
  label: string;
  description: string;
  /** Sampled trajectory (0,12,36,60,120,180 + retirement month). */
  points: ProjectionPoint[];
  /** Convenience lookups for headline horizons. */
  netWorthAt: { y1: number; y3: number; y5: number; y10: number; y15: number; retirement: number };
  /** Projected retirement corpus and the month it is sampled at. */
  retirementCorpusPaise: number;
  retirementMonth: number;
  /** Goals achievable within 10 years under this scenario. */
  goalsAchievable: number;
  /** Extra net worth at 10y vs the "current" scenario (0 for current). */
  upliftVsCurrentPaise: number;
}

export type RetirementReadiness = 'weak' | 'moderate' | 'strong';

export type RouteKind = 'current' | 'recommended' | 'aggressive' | 'safe';

export interface GpsRoute {
  kind: RouteKind;
  label: string;
  /** One-line description of the behaviour this route encodes. */
  description: string;
  /** Months to fully fund the emergency fund (null = already funded). */
  emergencyMonths: number | null;
  /** Per-goal ETA in months from now (Infinity-safe; capped at 600). */
  goalEtas: { goalId: string; name: string; icon: string | null; months: number }[];
  retirement: RetirementReadiness;
  /** Wealth velocity score under this route. */
  velocityScore: number;
  /** Projected net worth at 10 years on this route. */
  netWorth10yPaise: number;
  /** Monthly amount this route directs to investing (paise). */
  monthlyInvestPaise: number;
}

export interface MoneyGps {
  current: GpsRoute;
  recommended: GpsRoute;
  /** All four routes (current, recommended, aggressive, safe). */
  routes: GpsRoute[];
  /** One-line route-correction summary. */
  correction: string;
  /** Reasoning / assumptions / risks behind the recommended route. */
  trust: Trust;
}

// -----------------------------------------------------------------------------
// Action Plan (deterministic "what should I do next")
// -----------------------------------------------------------------------------
export interface ActionPlanItem {
  id: string;
  category: RecommendationCategory;
  title: string;
  body: string;
  amountPaise: number | null;
  /** Quantified upside, e.g. "Saves ₹18,900" or "Home goal 7 months sooner". */
  impactLabel: string;
  /** 1 = highest priority. */
  priority: number;
  effort: 'low' | 'medium' | 'high';
}

export interface ActionPlan {
  /** The single most costly current behavior. */
  biggestMistake: { title: string; body: string; costLabel: string } | null;
  /** The highest-leverage available move. */
  biggestOpportunity: { title: string; body: string; upsideLabel: string } | null;
  items: ActionPlanItem[];
}

// -----------------------------------------------------------------------------
// Subscription / entitlements
// -----------------------------------------------------------------------------
export type Feature =
  | 'blueprint_full'
  | 'velocity_score'
  | 'money_gps'
  | 'future_self'
  | 'unlimited_coach'
  | 'unlimited_goals'
  | 'advanced_projections';

export interface Entitlements {
  tier: SubscriptionTier;
  features: Record<Feature, boolean>;
  coachMessagesPerMonth: number; // Infinity for paid tiers
  maxActiveGoals: number; // Infinity for paid tiers
}
