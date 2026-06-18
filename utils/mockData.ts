/**
 * Realistic mock data so every screen looks alive in development/demo mode.
 * Modeled on "Priya, the Software Engineer" persona: ₹1.4L/month in-hand,
 * Bengaluru, balanced risk, building toward a home.
 */

import type {
  AIContext,
  Debt,
  Expense,
  FinancialProfile,
  Goal,
  Insight,
  Investment,
  Recommendation,
  UserProfile,
} from '@/types';
import { addMonthsISO } from '@/utils/date';

export const mockUser: UserProfile = {
  id: 'mock-user',
  email: 'priya@example.com',
  displayName: 'Priya',
  age: 28,
  maritalStatus: 'single',
  dependents: { parents: 2 },
  riskProfile: 'balanced',
  salaryDnaArchetype: 'builder',
  taxRegime: 'new',
  payDayOfMonth: 1,
  city: 'Bengaluru',
  subscriptionTier: 'free',
  onboardingCompletedAt: new Date().toISOString(),
  currency: 'INR',
};

export const mockExpenses: Expense[] = [
  { id: 'e1', userId: 'mock-user', category: 'rent', label: 'Rent', amountPaise: 3500000, isEssential: true, isRecurring: true, period: 'monthly' },
  { id: 'e2', userId: 'mock-user', category: 'food', label: 'Groceries & dining', amountPaise: 1800000, isEssential: true, isRecurring: true, period: 'monthly' },
  { id: 'e3', userId: 'mock-user', category: 'transport', label: 'Cab & fuel', amountPaise: 800000, isEssential: true, isRecurring: true, period: 'monthly' },
  { id: 'e4', userId: 'mock-user', category: 'utilities', label: 'Bills & internet', amountPaise: 600000, isEssential: true, isRecurring: true, period: 'monthly' },
  { id: 'e5', userId: 'mock-user', category: 'family_support', label: 'Family support', amountPaise: 1500000, isEssential: true, isRecurring: true, period: 'monthly' },
  { id: 'e6', userId: 'mock-user', category: 'subscriptions', label: 'Subscriptions', amountPaise: 200000, isEssential: false, isRecurring: true, period: 'monthly' },
];

export const mockInvestments: Investment[] = [
  { id: 'i1', userId: 'mock-user', assetClass: 'mf', instrumentName: 'Index Fund SIP', currentValuePaise: 45000000, investedValuePaise: 38000000, sipAmountPaise: 1500000, sipDay: 5, expectedReturnPct: 12 },
  { id: 'i2', userId: 'mock-user', assetClass: 'epf', instrumentName: 'EPF', currentValuePaise: 62000000, investedValuePaise: 62000000, sipAmountPaise: 900000, sipDay: 1, expectedReturnPct: 8.15 },
  { id: 'i3', userId: 'mock-user', assetClass: 'equity', instrumentName: 'Direct stocks', currentValuePaise: 18000000, investedValuePaise: 20000000, sipAmountPaise: null, sipDay: null, expectedReturnPct: 12 },
];

export const mockDebts: Debt[] = [
  { id: 'd1', userId: 'mock-user', type: 'credit_card', label: 'HDFC Card', principalOutstandingPaise: 4500000, emiPaise: 0, interestRate: 42, tenureMonthsRemaining: null, dueDay: 18 },
];

export const mockGoals: Goal[] = [
  { id: 'g1', userId: 'mock-user', type: 'house', name: 'Home Down Payment', icon: '🏠', targetAmountPaise: 4000000_00, currentAmountPaise: 850000_00, targetDate: addMonthsISO(48), priority: 1, monthlyContributionPaise: 4000000, probabilityOfSuccess: 72, status: 'on_track' },
  { id: 'g2', userId: 'mock-user', type: 'vacation', name: 'Europe Trip', icon: '✈️', targetAmountPaise: 250000_00, currentAmountPaise: 90000_00, targetDate: addMonthsISO(10), priority: 2, monthlyContributionPaise: 1500000, probabilityOfSuccess: 88, status: 'on_track' },
  { id: 'g3', userId: 'mock-user', type: 'car', name: 'Car Upgrade', icon: '🚗', targetAmountPaise: 1000000_00, currentAmountPaise: 120000_00, targetDate: addMonthsISO(30), priority: 3, monthlyContributionPaise: 2000000, probabilityOfSuccess: 54, status: 'at_risk' },
];

export const mockFinancialProfile: FinancialProfile = {
  id: 'fp1',
  userId: 'mock-user',
  monthlyIncomePaise: 14000000, // ₹1,40,000
  expectedGrowthPct: 10,
  totalExpensesPaise: mockExpenses.reduce((s, e) => s + e.amountPaise, 0),
  totalSavingsPaise: 30000000, // ₹3,00,000 liquid
  totalInvestmentsPaise: mockInvestments.reduce((s, i) => s + i.currentValuePaise, 0),
  totalDebtPaise: mockDebts.reduce((s, d) => s + d.principalOutstandingPaise, 0),
  emergencyMonthsTarget: 6,
  emergencyFundPaise: 25000000, // ₹2,50,000
  monthlySurplusPaise:
    14000000 - mockExpenses.reduce((s, e) => s + e.amountPaise, 0),
  netWorthPaise:
    30000000 +
    mockInvestments.reduce((s, i) => s + i.currentValuePaise, 0) -
    mockDebts.reduce((s, d) => s + d.principalOutstandingPaise, 0),
  assumptions: {
    expectedReturnEquityPct: 12,
    expectedReturnDebtPct: 7,
    inflationPct: 6,
    salaryGrowthPct: 10,
    retirementAge: 55,
  },
};

export const mockContext: AIContext = {
  profile: mockUser,
  financials: mockFinancialProfile,
  goals: mockGoals,
  expenses: mockExpenses,
  debts: mockDebts,
  investments: mockInvestments,
  scores: null, // computed by the engine at runtime
};

export const mockRecommendations: Recommendation[] = [
  {
    id: 'r1',
    userId: 'mock-user',
    blueprintId: null,
    category: 'debt',
    title: 'Clear your ₹45,000 credit card balance',
    body: 'At 42% APR this is your most expensive money. Paying it off this month is effectively a 42% guaranteed return.',
    amountPaise: 4500000,
    rationale: { rule: 'high_interest_debt', apr: 42 },
    impactEstimate: { interestSavedPaise: 1890000 },
    priority: 1,
    status: 'suggested',
  },
  {
    id: 'r2',
    userId: 'mock-user',
    blueprintId: null,
    category: 'investment',
    title: 'Increase your SIP by ₹5,000',
    body: 'Your surplus can support a higher SIP. This brings your home goal forward by ~7 months.',
    amountPaise: 500000,
    rationale: { rule: 'surplus_utilization' },
    impactEstimate: { goalSpeedupMonths: 7 },
    priority: 2,
    status: 'suggested',
  },
  {
    id: 'r3',
    userId: 'mock-user',
    blueprintId: null,
    category: 'insurance',
    title: 'You have no term life cover',
    body: 'With parents depending on you, a ₹1Cr term plan (~₹900/month) protects them if anything happens to you.',
    amountPaise: 90000,
    rationale: { rule: 'insurance_gap' },
    impactEstimate: { coverPaise: 10000000_00 },
    priority: 3,
    status: 'suggested',
  },
];

export const mockInsights: Insight[] = [
  {
    id: 'in1',
    theme: 'savings',
    headline: 'Your savings rate climbed to 41%',
    body: 'Up from 36% last quarter — you’re keeping more of every rupee. Keep it above 30% and your goals stay on track.',
    sentiment: 1,
    series: [
      { label: 'Mar', value: 34 },
      { label: 'Apr', value: 36 },
      { label: 'May', value: 38 },
      { label: 'Jun', value: 41 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'in2',
    theme: 'spending',
    headline: 'Dining spend grew faster than income',
    body: 'Food & dining rose 18% while income rose 4%. That’s early lifestyle inflation — capping dining at ₹15k keeps it in check.',
    sentiment: -1,
    series: [
      { label: 'Mar', value: 14000 },
      { label: 'Apr', value: 15500 },
      { label: 'May', value: 16800 },
      { label: 'Jun', value: 18000 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'in3',
    theme: 'wealth',
    headline: 'Net worth up ₹1.2L this quarter',
    body: 'Investments and EPF drove the gain. At this pace your net worth doubles in about 4 years.',
    sentiment: 1,
    series: [
      { label: 'Mar', value: 1180000 },
      { label: 'Apr', value: 1210000 },
      { label: 'May', value: 1255000 },
      { label: 'Jun', value: 1300000 },
    ],
    createdAt: new Date().toISOString(),
  },
];
