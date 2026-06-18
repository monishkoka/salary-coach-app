/**
 * Row <-> domain mappers. The database uses snake_case bigint-paise columns
 * (see supabase/migrations/0001_init.sql); the app uses camelCase domain types.
 * Keeping the translation in one place means a schema change touches one file.
 */

import type {
  Debt,
  Expense,
  FinancialProfile,
  Goal,
  Investment,
  ProfileAssumptions,
  SalaryBlueprint,
  UserProfile,
} from '@/types';

type Row = Record<string, any>;

// --- User --------------------------------------------------------------------
export function userToRow(u: UserProfile): Row {
  return {
    id: u.id,
    email: u.email,
    display_name: u.displayName,
    age: u.age,
    marital_status: u.maritalStatus,
    dependents: u.dependents ?? {},
    risk_profile: u.riskProfile,
    salary_dna_archetype: u.salaryDnaArchetype,
    tax_regime: u.taxRegime,
    pay_day_of_month: u.payDayOfMonth,
    city: u.city,
    subscription_tier: u.subscriptionTier,
    onboarding_completed_at: u.onboardingCompletedAt,
    currency: u.currency,
  };
}

export function rowToUser(r: Row): UserProfile {
  return {
    id: r.id,
    email: r.email ?? null,
    displayName: r.display_name ?? '',
    age: r.age ?? null,
    maritalStatus: r.marital_status ?? null,
    dependents: r.dependents ?? {},
    riskProfile: r.risk_profile ?? 'balanced',
    salaryDnaArchetype: r.salary_dna_archetype ?? null,
    taxRegime: r.tax_regime ?? 'new',
    payDayOfMonth: r.pay_day_of_month ?? null,
    city: r.city ?? null,
    subscriptionTier: r.subscription_tier ?? 'free',
    onboardingCompletedAt: r.onboarding_completed_at ?? null,
    currency: r.currency ?? 'INR',
  };
}

// --- Financial profile -------------------------------------------------------
export function financialProfileToRow(f: FinancialProfile, userId: string): Row {
  return {
    user_id: userId,
    monthly_income_paise: f.monthlyIncomePaise,
    expected_growth_pct: f.expectedGrowthPct,
    total_expenses_paise: f.totalExpensesPaise,
    total_savings_paise: f.totalSavingsPaise,
    total_investments_paise: f.totalInvestmentsPaise,
    total_debt_paise: f.totalDebtPaise,
    emergency_months_target: f.emergencyMonthsTarget,
    emergency_fund_paise: f.emergencyFundPaise,
    monthly_surplus_paise: f.monthlySurplusPaise,
    net_worth_paise: f.netWorthPaise,
    assumptions: f.assumptions,
  };
}

export function rowToFinancialProfile(r: Row): FinancialProfile {
  const assumptions: ProfileAssumptions = {
    expectedReturnEquityPct: r.assumptions?.expectedReturnEquityPct ?? 12,
    expectedReturnDebtPct: r.assumptions?.expectedReturnDebtPct ?? 7,
    inflationPct: r.assumptions?.inflationPct ?? 6,
    salaryGrowthPct: r.assumptions?.salaryGrowthPct ?? 10,
    retirementAge: r.assumptions?.retirementAge ?? 60,
  };
  return {
    id: r.id ?? 'fp',
    userId: r.user_id,
    monthlyIncomePaise: Number(r.monthly_income_paise ?? 0),
    expectedGrowthPct: Number(r.expected_growth_pct ?? 8),
    totalExpensesPaise: Number(r.total_expenses_paise ?? 0),
    totalSavingsPaise: Number(r.total_savings_paise ?? 0),
    totalInvestmentsPaise: Number(r.total_investments_paise ?? 0),
    totalDebtPaise: Number(r.total_debt_paise ?? 0),
    emergencyMonthsTarget: Number(r.emergency_months_target ?? 6),
    emergencyFundPaise: Number(r.emergency_fund_paise ?? 0),
    monthlySurplusPaise: Number(r.monthly_surplus_paise ?? 0),
    netWorthPaise: Number(r.net_worth_paise ?? 0),
    assumptions,
  };
}

// --- Goal --------------------------------------------------------------------
export function goalToRow(g: Goal, userId: string): Row {
  return {
    id: g.id,
    user_id: userId,
    type: g.type,
    name: g.name,
    icon: g.icon,
    target_amount_paise: g.targetAmountPaise,
    current_amount_paise: g.currentAmountPaise,
    target_date: g.targetDate,
    priority: g.priority,
    monthly_contribution_paise: g.monthlyContributionPaise,
    probability_of_success: g.probabilityOfSuccess,
    status: g.status,
  };
}

export function rowToGoal(r: Row): Goal {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type ?? 'custom',
    name: r.name,
    icon: r.icon ?? null,
    targetAmountPaise: Number(r.target_amount_paise ?? 0),
    currentAmountPaise: Number(r.current_amount_paise ?? 0),
    targetDate: r.target_date ?? null,
    priority: Number(r.priority ?? 1),
    monthlyContributionPaise: Number(r.monthly_contribution_paise ?? 0),
    probabilityOfSuccess: r.probability_of_success != null ? Number(r.probability_of_success) : null,
    status: r.status ?? 'on_track',
  };
}

// --- Expense / Investment / Debt --------------------------------------------
export function rowToExpense(r: Row): Expense {
  return {
    id: r.id,
    userId: r.user_id,
    category: r.category,
    label: r.label ?? null,
    amountPaise: Number(r.amount_paise ?? 0),
    isEssential: !!r.is_essential,
    isRecurring: !!r.is_recurring,
    period: r.period ?? 'monthly',
  };
}

export function rowToInvestment(r: Row): Investment {
  return {
    id: r.id,
    userId: r.user_id,
    assetClass: r.asset_class,
    instrumentName: r.instrument_name ?? null,
    currentValuePaise: Number(r.current_value_paise ?? 0),
    investedValuePaise: Number(r.invested_value_paise ?? 0),
    sipAmountPaise: r.sip_amount_paise != null ? Number(r.sip_amount_paise) : null,
    sipDay: r.sip_day ?? null,
    expectedReturnPct: r.expected_return_pct != null ? Number(r.expected_return_pct) : null,
  };
}

export function rowToDebt(r: Row): Debt {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    label: r.label ?? null,
    principalOutstandingPaise: Number(r.principal_outstanding_paise ?? 0),
    emiPaise: Number(r.emi_paise ?? 0),
    interestRate: r.interest_rate != null ? Number(r.interest_rate) : null,
    tenureMonthsRemaining: r.tenure_months_remaining ?? null,
    dueDay: r.due_day ?? null,
  };
}

// --- Blueprint ---------------------------------------------------------------
export function blueprintToRow(b: SalaryBlueprint, userId: string): Row {
  return {
    id: b.id,
    user_id: userId,
    period_start: b.periodStart,
    period_end: b.periodEnd,
    income_paise: b.incomePaise,
    allocations: b.allocations,
    summary: b.summary,
    actions_total: b.actionsTotal,
    actions_done: b.actionsDone,
    generated_by: b.generatedBy,
  };
}
