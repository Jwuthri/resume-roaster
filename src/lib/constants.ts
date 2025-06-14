// Model constants that can be safely imported on both client and server
export const OPENAI_MODELS = {
  NANO: 'gpt-4.1-nano',
  MINI: 'gpt-4.1-mini',
  NORMAL: 'gpt-4.1',
  LARGE: 'o4-mini-high'
} as const

export const ANTHROPIC_MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022',
  SONNET: 'claude-sonnet-4-20250514', 
  OPUS: 'claude-opus-4-20250514',
} as const

// Credit costs for each model tier
export const MODEL_CREDIT_COSTS = {
  // OpenAI models
  [OPENAI_MODELS.NANO]: 1,
  [OPENAI_MODELS.MINI]: 4,
  [OPENAI_MODELS.NORMAL]: 8,
  [OPENAI_MODELS.LARGE]: 12,
  // Anthropic models
  [ANTHROPIC_MODELS.HAIKU]: 1,
  [ANTHROPIC_MODELS.SONNET]: 8,
  [ANTHROPIC_MODELS.OPUS]: 12,
} as const

// Model tier labels for UI
export const MODEL_TIER_LABELS = {
  [OPENAI_MODELS.NANO]: 'OpenAI Nano',
  [OPENAI_MODELS.MINI]: 'OpenAI Mini',
  [OPENAI_MODELS.NORMAL]: 'OpenAI Normal',
  [OPENAI_MODELS.LARGE]: 'OpenAI Large',
  [ANTHROPIC_MODELS.HAIKU]: 'Claude Haiku',
  [ANTHROPIC_MODELS.SONNET]: 'Claude Sonnet 4',
  [ANTHROPIC_MODELS.OPUS]: 'Claude Opus 4',
} as const

// Helper function to get credit cost for a model
export function getModelCreditCost(model: string): number {
  return MODEL_CREDIT_COSTS[model as keyof typeof MODEL_CREDIT_COSTS] || 1
}

// Context size constants
export const CONTEXT_SIZES = {
  MINI: 1000,
  NORMAL: 4000,
  LARGE: 8000,
  XLARGE: 40000,
  MAX: 200000
} as const

// Temperature constants
export const TEMPERATURES = {
  DETERMINISTIC: 0,
  LOW: 0.1,
  NORMAL: 0.3,
  HIGH: 0.7,
  CREATIVE: 1.0
} as const 