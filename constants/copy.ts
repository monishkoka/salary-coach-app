/** Static, India-specific copy reused across onboarding and coaching. */

import type { GoalType } from '@/types';

export const GOAL_PRESETS: {
  type: GoalType;
  name: string;
  icon: string;
  suggestedAmountPaise: number;
  suggestedMonths: number;
}[] = [
  { type: 'emergency', name: 'Emergency Fund', icon: '🛟', suggestedAmountPaise: 30_000_00, suggestedMonths: 12 },
  { type: 'house', name: 'Buy a Home', icon: '🏠', suggestedAmountPaise: 2_000_000_00, suggestedMonths: 60 },
  { type: 'car', name: 'Buy a Car', icon: '🚗', suggestedAmountPaise: 1_000_000_00, suggestedMonths: 36 },
  { type: 'marriage', name: 'Marriage', icon: '💍', suggestedAmountPaise: 1_500_000_00, suggestedMonths: 30 },
  { type: 'vacation', name: 'Vacation', icon: '✈️', suggestedAmountPaise: 150_000_00, suggestedMonths: 12 },
  { type: 'child_education', name: 'Child Education', icon: '🎓', suggestedAmountPaise: 5_000_000_00, suggestedMonths: 180 },
  { type: 'retirement', name: 'Retirement', icon: '🌅', suggestedAmountPaise: 50_000_000_00, suggestedMonths: 360 },
];

export const RISK_QUESTIONS: {
  id: string;
  prompt: string;
  options: { label: string; score: number }[];
}[] = [
  {
    id: 'drop',
    prompt: 'Your investments drop 20% in a month. What do you do?',
    options: [
      { label: 'Sell everything — I can’t handle the loss', score: 0 },
      { label: 'Sell some to feel safer', score: 1 },
      { label: 'Hold and wait it out', score: 2 },
      { label: 'Invest more — it’s on sale', score: 3 },
    ],
  },
  {
    id: 'horizon',
    prompt: 'When will you need most of this money?',
    options: [
      { label: 'Within 1 year', score: 0 },
      { label: '1–3 years', score: 1 },
      { label: '3–7 years', score: 2 },
      { label: '7+ years', score: 3 },
    ],
  },
  {
    id: 'priority',
    prompt: 'What matters more to you?',
    options: [
      { label: 'Protecting what I have', score: 0 },
      { label: 'A balance of safety and growth', score: 2 },
      { label: 'Maximum long-term growth', score: 3 },
    ],
  },
];

export const COACH_SUGGESTED_PROMPTS = [
  'Can I afford a ₹12L car?',
  'Should I buy the new iPhone?',
  'How am I improving over time?',
  'How much should I invest each month?',
  'Can I take a ₹1.5L vacation?',
  'How long until I can buy a house?',
] as const;

export const SALARY_DNA = {
  builder: { name: 'The Builder', tagline: 'Steady, disciplined, compounding.', icon: '🧱' },
  sprinter: { name: 'The Sprinter', tagline: 'High energy, watch lifestyle creep.', icon: '⚡️' },
  hoarder: { name: 'The Hoarder', tagline: 'Great saver — put idle cash to work.', icon: '🏦' },
  tightrope: { name: 'The Tightrope Walker', tagline: 'Living close to the edge — build a buffer.', icon: '🎪' },
} as const;
