import type { VerificationResult } from './types';

export function scoreVerification(input: {
  independentEvidence: number;
  contradictions?: number;
  directObservation?: boolean;
  stale?: boolean;
}): VerificationResult {
  let confidence = 0.35;
  confidence += Math.min(input.independentEvidence, 3) * 0.18;
  if (input.directObservation) confidence += 0.18;
  confidence -= Math.min(input.contradictions ?? 0, 3) * 0.2;
  if (input.stale) confidence -= 0.15;
  confidence = Math.max(0, Math.min(1, confidence));

  const label = confidence >= 0.82 ? 'verified' : confidence >= 0.55 ? 'supported' : 'uncertain';
  const reasons: string[] = [];
  if (input.directObservation) reasons.push('Directly observed or tool-verified.');
  if (input.independentEvidence) reasons.push(`${input.independentEvidence} supporting evidence source(s).`);
  if (input.contradictions) reasons.push(`${input.contradictions} contradiction(s) detected.`);
  if (input.stale) reasons.push('Evidence may be stale.');

  return { confidence, label, reasons, evidenceCount: input.independentEvidence };
}
