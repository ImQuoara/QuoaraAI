import type { ChatMessage } from '@/ai/provider';

export type ProviderCostMode = 'free_only' | 'owner_approved_paid';
export type ProviderCapability = 'chat' | 'research' | 'image' | 'video' | 'voice';

export interface ProviderIdentity {
  id: string;
  displayName: string;
  capability: ProviderCapability;
  costMode: ProviderCostMode;
}

export interface ChatProviderContract extends ProviderIdentity {
  capability: 'chat';
  generate(messages: ChatMessage[]): Promise<{ text: string; model: string }>;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface ResearchProviderContract extends ProviderIdentity {
  capability: 'research';
  search(query: string): Promise<{ sources: ResearchSource[]; provider: string }>;
}

export interface ImageRequest {
  prompt: string;
  aspectRatio: string;
}

export interface ImageGeneration {
  dataUrl: string;
  model: string;
  estimatedCostUsd: number;
}

export interface ImageProviderContract extends ProviderIdentity {
  capability: 'image';
  generate(request: ImageRequest): Promise<ImageGeneration>;
}

export interface VideoRequest {
  prompt: string;
  imageReferenceUrl?: string;
  durationSeconds?: number;
  aspectRatio?: string;
}

export interface VideoGeneration {
  assetUrl: string;
  model: string;
  estimatedCostUsd: number;
}

export interface VideoProviderContract extends ProviderIdentity {
  capability: 'video';
  generate(request: VideoRequest): Promise<VideoGeneration>;
}
