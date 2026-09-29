import type { ModelRoute, TaskCategory } from './types';

const ROUTES: Record<TaskCategory, ModelRoute> = {
  conversation: { category: 'conversation', preferredProvider: 'gemini', rationale: 'Fast general conversational route with the currently configured provider.' },
  coding: { category: 'coding', preferredProvider: 'openai-or-coding-adapter', fallbackProvider: 'gemini', rationale: 'Prefer a coding-specialized provider when connected; otherwise use the configured fallback.' },
  research: { category: 'research', preferredProvider: 'research-adapter', fallbackProvider: 'gemini', rationale: 'Research should prefer a provider with browsing/citation support.' },
  creative: { category: 'creative', preferredProvider: 'gemini', rationale: 'Current provider is suitable for multimodal/creative planning.' },
  reasoning: { category: 'reasoning', preferredProvider: 'reasoning-adapter', fallbackProvider: 'gemini', rationale: 'Prefer the strongest reasoning route available under cost and approval rules.' },
  vision: { category: 'vision', preferredProvider: 'vision-adapter', fallbackProvider: 'gemini', rationale: 'Use a provider that accepts image input when connected.' },
  audio: { category: 'audio', preferredProvider: 'audio-adapter', fallbackProvider: 'gemini', rationale: 'Use a speech/audio provider when connected.' },
  automation: { category: 'automation', preferredProvider: 'gemini', rationale: 'Planning can use the configured provider; execution remains gated by governance.' },
};

export function routeTask(category: TaskCategory): ModelRoute {
  return ROUTES[category];
}
