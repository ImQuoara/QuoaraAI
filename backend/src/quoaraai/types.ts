export type CapabilityStatus = 'active' | 'foundation' | 'adapter_required';

export type ActionKind =
  | 'read'
  | 'analyze'
  | 'draft'
  | 'write'
  | 'send'
  | 'deploy'
  | 'purchase'
  | 'delete'
  | 'permission_change'
  | 'memory_promote'
  | 'skill_activate'
  | 'policy_change'
  | 'model_route_change'
  | 'dependency_install'
  | 'configuration_change'
  | 'auth_change'
  | 'external_side_effect';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalDecision = 'allow' | 'approval_required' | 'deny';

export interface ActionPlan {
  kind: ActionKind;
  title: string;
  description: string;
  risk?: RiskLevel;
  reversible?: boolean;
  external?: boolean;
  estimatedCostUsd?: number;
}

export interface GovernanceDecision {
  decision: ApprovalDecision;
  reason: string;
  requiresExplicitApproval: boolean;
}

export type TaskCategory =
  | 'conversation'
  | 'coding'
  | 'research'
  | 'creative'
  | 'reasoning'
  | 'vision'
  | 'audio'
  | 'automation';

export interface ModelRoute {
  category: TaskCategory;
  preferredProvider: string;
  preferredModel?: string;
  fallbackProvider?: string;
  rationale: string;
}

export interface VerificationResult {
  confidence: number;
  label: 'verified' | 'supported' | 'uncertain';
  reasons: string[];
  evidenceCount: number;
}

export interface SkillPackage {
  name: string;
  description: string;
  version: number;
  steps: Array<{ name: string; instruction: string }>;
  permissions: ActionKind[];
}
