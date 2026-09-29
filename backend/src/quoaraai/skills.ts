import type { SkillPackage } from './types';

const MAX_SKILL_STEPS = 50;

export function validateSkillPackage(input: unknown): SkillPackage | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (typeof value.name !== 'string' || !value.name.trim()) return null;
  if (typeof value.description !== 'string') return null;
  if (!Number.isInteger(value.version) || (value.version as number) < 1) return null;
  if (!Array.isArray(value.steps) || value.steps.length === 0 || value.steps.length > MAX_SKILL_STEPS) return null;
  if (!Array.isArray(value.permissions)) return null;

  const steps = value.steps.map((step) => {
    if (!step || typeof step !== 'object') return null;
    const s = step as Record<string, unknown>;
    if (typeof s.name !== 'string' || typeof s.instruction !== 'string') return null;
    return { name: s.name.trim(), instruction: s.instruction.trim() };
  });
  if (steps.some((step) => !step || !step.name || !step.instruction)) return null;

  return {
    name: value.name.trim(),
    description: value.description,
    version: value.version as number,
    steps: steps as SkillPackage['steps'],
    permissions: value.permissions as SkillPackage['permissions'],
  };
}
