import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { QUOARAAI_CAPABILITIES } from '../src/quoaraai/capabilities';
import { buildCouncilBrief, DEFAULT_COUNCIL } from '../src/quoaraai/council';
import { chooseLowerCostRoute } from '../src/quoaraai/cost';
import { evaluateAction } from '../src/quoaraai/governance';
import { routeTask } from '../src/quoaraai/router';
import { validateSkillPackage } from '../src/quoaraai/skills';
import { scoreVerification } from '../src/quoaraai/verification';

test('all 20 requested QuoaraAi capabilities are represented', () => {
  assert.equal(QUOARAAI_CAPABILITIES.length, 20);
  assert.equal(new Set(QUOARAAI_CAPABILITIES.map((x) => x.id)).size, 20);
});

test('owner-first governance allows local analysis but gates mutations', () => {
  assert.equal(evaluateAction({ kind: 'analyze', title: 'Review', description: 'Review local code' }).decision, 'allow');
  assert.equal(evaluateAction({ kind: 'send', title: 'Email', description: 'Send outreach', external: true }).decision, 'approval_required');
  assert.equal(evaluateAction({ kind: 'deploy', title: 'Deploy', description: 'Deploy production' }).decision, 'approval_required');
  assert.equal(evaluateAction({ kind: 'delete', title: 'Delete', description: 'Delete records', risk: 'critical' }).decision, 'approval_required');
});

test('council provides distinct builder critic research verifier security roles', () => {
  assert.deepEqual(DEFAULT_COUNCIL.map((x) => x.role), ['builder', 'critic', 'researcher', 'verifier', 'security']);
  assert.equal(buildCouncilBrief('test').length, 5);
});

test('router produces a fallback-aware coding route', () => {
  const route = routeTask('coding');
  assert.equal(route.category, 'coding');
  assert.equal(route.fallbackProvider, 'gemini');
});

test('verification engine labels strong evidence as verified', () => {
  const result = scoreVerification({ independentEvidence: 3, directObservation: true });
  assert.equal(result.label, 'verified');
  assert.ok(result.confidence >= 0.82);
});

test('cost intelligence chooses the least expensive valid route', () => {
  const route = chooseLowerCostRoute([
    { provider: 'a', model: 'one', estimatedUsd: 0.20, basis: 'estimate' },
    { provider: 'b', model: 'two', estimatedUsd: 0.05, basis: 'estimate' },
  ]);
  assert.equal(route?.provider, 'b');
});

test('skill packages require explicit structured steps', () => {
  const skill = validateSkillPackage({
    name: 'EPK outreach', description: 'Qualify and draft outreach', version: 1,
    steps: [{ name: 'qualify', instruction: 'Check whether the lead fits.' }],
    permissions: ['read', 'draft'],
  });
  assert.equal(skill?.name, 'EPK outreach');
  assert.equal(validateSkillPackage({ name: 'bad' }), null);
});

test('intelligence migration keeps all new feature tables server-only', () => {
  const sql = readFileSync('supabase/migrations/20260928000000_quoaraai_intelligence_foundation.sql', 'utf8');
  for (const table of ['quoaraai_projects','quoaraai_goals','quoaraai_memories','quoaraai_skills','quoaraai_learning_candidates','quoaraai_action_requests','quoaraai_action_ledger','quoaraai_watchers','quoaraai_cost_events','quoaraai_assets','quoaraai_evaluations','quoaraai_snapshots']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(sql, /revoke all privileges on table public\.%I from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.%I to service_role/i);
});


test('any possible monetary cost requires owner approval', () => {
  assert.equal(evaluateAction({ kind: 'read', title: 'Paid research', description: 'Read using a billed provider', estimatedCostUsd: 0.0001 }).decision, 'approval_required');
});

test('tenant hardening migration rejects mismatched project/user bindings', () => {
  const sql = readFileSync('supabase/migrations/20260928001000_quoaraai_project_tenant_guard.sql', 'utf8');
  assert.match(sql, /create or replace function public\.enforce_quoaraai_project_owner\(\)/i);
  assert.match(sql, /p\.id = new\.project_id/i);
  assert.match(sql, /p\.user_id = new\.user_id/i);
  assert.match(sql, /before insert or update of user_id, project_id/i);
});

test('free image route is disabled by default and execution re-verifies signed approval', () => {
  const route = readFileSync('src/app/api/image/route.ts', 'utf8');
  const prepare = readFileSync('src/app/api/image/prepare/route.ts', 'utf8');
  const actionBinding = readFileSync('src/lib/actions/image-action.ts', 'utf8');
  const env = readFileSync('.env.example', 'utf8');

  assert.match(env, /QUOARAAI_IMAGE_GENERATION_ENABLED=false/);
  assert.match(prepare, /approval_expires_at/);
  assert.match(prepare, /free_only_v2/);
  assert.match(actionBinding, /createHash\('sha256'\)/i);
  assert.match(actionBinding, /chooseFreeImageCandidates/);
  assert.match(route, /validateStoredImageAction/);
  assert.match(route, /verifyP256Signature/);
  assert.match(route, /owner_devices/);
  assert.match(route, /No provider call was made/i);
  assert.doesNotMatch(route, /paid fallback/i);
});

test('owner approval integrity migration makes signed approval + ledger atomic and ledgers append-only', () => {
  const sql = readFileSync('supabase/migrations/20260928004000_owner_approval_integrity.sql', 'utf8');
  assert.match(sql, /create or replace function public\.approve_owner_action_request/i);
  assert.match(sql, /ar\.payload->>'action_hash' = p_action_hash/i);
  assert.match(sql, /insert into public\.owner_action_ledger/i);
  assert.match(sql, /create or replace function public\.register_owner_device/i);
  assert.match(sql, /where d\.status = 'active'/i);
  assert.match(sql, /create or replace function public\.decide_owner_action_request/i);
  assert.match(sql, /revoke update, delete, truncate on table public\.owner_action_ledger from service_role/i);
  assert.match(sql, /revoke update, delete, truncate on table public\.quoaraai_action_ledger from service_role/i);
});
