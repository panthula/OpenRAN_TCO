/**
 * AI Provider Configuration
 *
 * Supports Claude (Anthropic), OpenAI, or mock mode for development.
 * Configure via environment variables:
 * - AI_PROVIDER: 'claude' | 'openai' | 'mock'
 * - AI_API_KEY: API key for the provider
 * - AI_MODEL: Model to use (e.g., 'claude-sonnet-4-20250514', 'gpt-4o')
 */

export type AIProvider = 'claude' | 'openai' | 'mock';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string | null;
  model: string;
  maxTokens: number;
  temperature: number;
}

// Default models for each provider
const DEFAULT_MODELS: Record<AIProvider, string> = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  mock: 'mock',
};

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'mock') as AIProvider;
  const validProviders: AIProvider[] = ['claude', 'openai', 'mock'];

  if (!validProviders.includes(provider)) {
    console.warn(`Invalid AI_PROVIDER "${provider}", falling back to mock`);
  }

  const finalProvider = validProviders.includes(provider) ? provider : 'mock';

  return {
    provider: finalProvider,
    apiKey: process.env.AI_API_KEY || null,
    model: process.env.AI_MODEL || DEFAULT_MODELS[finalProvider],
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  };
}

export function isAIEnabled(): boolean {
  const config = getAIConfig();
  return config.provider !== 'mock' && !!config.apiKey;
}
