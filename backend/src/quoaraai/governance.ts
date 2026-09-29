import type { ActionPlan, GovernanceDecision } from './types';

const AUTO_ALLOWED = new Set(['read', 'analyze', 'draft']);

export const QUOARAAI_GOVERNANCE_VERSION = '1.0';

export function evaluateAction(plan: ActionPlan): GovernanceDecision {
  const kind = plan.kind;
  const risk = plan.risk ?? 'low';
  const external = plan.external ?? false;

  if ((plan.estimatedCostUsd ?? 0) > 0) {
    return {
      decision: 'approval_required',
      reason: 'Any action that may incur a monetary charge requires exact owner approval.',
      requiresExplicitApproval: true,
    };
  }

  if (risk === 'critical') {
    return {
      decision: 'approval_required',
      reason: 'Critical-risk actions always require explicit owner approval.',
      requiresExplicitApproval: true,
    };
  }

  if (AUTO_ALLOWED.has(kind) && !external && (plan.estimatedCostUsd ?? 0) <= 0) {
    return {
      decision: 'allow',
      reason: 'Read-only analysis or drafting has no external side effect.',
      requiresExplicitApproval: false,
    };
  }

  return {
    decision: 'approval_required',
    reason: 'QuoaraAi must advise first and wait for owner approval before taking external or mutating actions.',
    requiresExplicitApproval: true,
  };
}

export function canExecuteWithoutApproval(plan: ActionPlan) {
  return evaluateAction(plan).decision === 'allow';
}
