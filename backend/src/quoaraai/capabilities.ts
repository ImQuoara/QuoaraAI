import type { CapabilityStatus } from './types';

export interface QuoaraAiCapability {
  id: string;
  name: string;
  description: string;
  status: CapabilityStatus;
  approvalRequiredForSideEffects: boolean;
}

export const QUOARAAI_CAPABILITIES: QuoaraAiCapability[] = [
  { id: 'mobile', name: 'Phone-first PWA', description: 'Installable Android-friendly web app with no authenticated-response caching in the service worker.', status: 'active', approvalRequiredForSideEffects: false },
  { id: 'owner_lock', name: 'Owner-only Access', description: 'Protected pages and APIs require the configured owner Supabase user ID.', status: 'active', approvalRequiredForSideEffects: true },
  { id: 'research_web', name: 'Source-backed Web Research', description: 'Free-tier Tavily search adapter returns live source snippets without letting retrieved content become instructions.', status: 'adapter_required', approvalRequiredForSideEffects: true },
  { id: 'image_generation', name: 'Image Generation', description: 'Free-first Cloudflare Workers AI image route with exact-action approval, audit gating, and no paid fallback.', status: 'adapter_required', approvalRequiredForSideEffects: true },
  { id: 'adult_safety', name: 'Adult-content Safety Boundary', description: 'QuoaraAi does not blanket-block lawful adult prompts, but it blocks minors, coercive sexual content, exploitation, and unlawful sexual content.', status: 'active', approvalRequiredForSideEffects: false },
  { id: 'video_creation', name: 'Video Creation', description: 'Planned future capability for short-form video generation after the phone alpha is stable and the provider/cost path is owner-approved.', status: 'foundation', approvalRequiredForSideEffects: true },
  { id: 'memory', name: 'Persistent Memory + Knowledge Graph', description: 'Project-scoped memories, decisions, facts, context, and relationships stored as reviewable records.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'skills', name: 'Skill Learning', description: 'Versioned reusable procedures with success/failure counters and explicit approval before activation.', status: 'foundation', approvalRequiredForSideEffects: true },
  { id: 'council', name: 'Council Mode', description: 'Plans builder, critic, researcher, verifier, and security-review roles before combining conclusions.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'router', name: 'Intelligent Model Routing', description: 'Routes tasks by category, quality, cost, and available provider adapters.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'projects', name: 'Project Mode', description: 'Persistent projects, goals, status, progress, files, and linked work.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'work_sessions', name: 'Autonomous Work Sessions', description: 'Structured work plans that can continue across tasks, while pausing for approval before external changes.', status: 'foundation', approvalRequiredForSideEffects: true },
  { id: 'verification', name: 'Confidence + Verification Engine', description: 'Evidence-aware confidence labels that distinguish verified, supported, and uncertain claims.', status: 'active', approvalRequiredForSideEffects: false },
  { id: 'critique', name: 'Self-Critique Loop', description: 'Generate, critique, repair, verify workflow for important outputs.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'sandbox', name: 'Sandboxed Code Execution', description: 'Adapter boundary for isolated execution and tests without granting the AI direct host access.', status: 'adapter_required', approvalRequiredForSideEffects: true },
  { id: 'permissions', name: 'Permission System', description: 'Central policy engine. Reads/analysis/drafts may proceed; writes, sends, deployment, purchases, deletes, and permission changes require explicit approval.', status: 'active', approvalRequiredForSideEffects: true },
  { id: 'ledger', name: 'Action Ledger', description: 'Append-only record of proposed, approved, executed, failed, and reverted actions.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'rollback', name: 'Rollback / Undo', description: 'Snapshot records that allow reversible operations to store before-state data for later rollback.', status: 'foundation', approvalRequiredForSideEffects: true },
  { id: 'marketplace', name: 'Personal Skill Marketplace', description: 'Import/export format for user-approved skill packages without giving imported skills automatic permissions.', status: 'foundation', approvalRequiredForSideEffects: true },
  { id: 'vault', name: 'Private Knowledge Vault / RAG', description: 'Project assets and memory records ready for retrieval adapters and embeddings.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'multimodal', name: 'Multimodal Workspace', description: 'Typed references for image, video, audio, document, code, and URL assets.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'voice', name: 'Voice Agent Mode', description: 'Adapter boundary for speech input/output and spoken progress reports.', status: 'adapter_required', approvalRequiredForSideEffects: true },
  { id: 'watchers', name: 'Watchers', description: 'Persistent watcher definitions for jobs, replies, uptime, releases, and other future conditions.', status: 'foundation', approvalRequiredForSideEffects: true },
  { id: 'goals', name: 'Goal Engine', description: 'Long-running goals with progress, priority, target dates, and linked project work.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'cost', name: 'Cost Intelligence', description: 'Provider/model cost-event tracking for later routing optimization.', status: 'foundation', approvalRequiredForSideEffects: false },
  { id: 'override', name: 'Owner Override Layer', description: 'Owner approval remains authoritative for external changes, spending, deployment, deletion, permission expansion, and core-policy changes.', status: 'active', approvalRequiredForSideEffects: true },
];
