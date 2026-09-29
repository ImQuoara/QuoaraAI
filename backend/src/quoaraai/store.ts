import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export async function getQuoaraAiOverview(userId: string) {
  const admin = createAdminClient();
  const tables = ['quoaraai_projects', 'quoaraai_goals', 'quoaraai_memories', 'quoaraai_skills', 'quoaraai_action_requests', 'quoaraai_watchers'] as const;
  const result: Record<string, number> = {};

  for (const table of tables) {
    const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) throw error;
    result[table] = count ?? 0;
  }

  const { count: pendingApprovals, error: pendingError } = await admin
    .from('owner_action_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (pendingError) throw pendingError;

  const { count: pendingLearning, error: learningError } = await admin
    .from('quoaraai_learning_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (learningError) throw learningError;

  return { counts: result, pendingApprovals: pendingApprovals ?? 0, pendingLearning: pendingLearning ?? 0 };
}

export async function listActionRequests(userId: string) {
  const { data, error } = await createAdminClient()
    .from('owner_action_requests')
    .select('id,kind,title,description,risk,status,reversible,estimated_cost_usd,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function decideActionRequest(userId: string, id: string, decision: 'approved' | 'rejected') {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('decide_owner_action_request', {
    p_user_id: userId,
    p_action_request_id: id,
    p_decision: decision,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] ?? null : null;
}

export async function listProjects(userId: string) {
  const { data, error } = await createAdminClient().from('quoaraai_projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProject(userId: string, name: string, description: string) {
  const { data, error } = await createAdminClient().from('quoaraai_projects').insert({ user_id: userId, name, description }).select('*').single();
  if (error) throw error;
  return data;
}

export async function listGoals(userId: string) {
  const { data, error } = await createAdminClient().from('quoaraai_goals').select('*').eq('user_id', userId).order('priority', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(userId: string, title: string, projectId?: string | null) {
  const { data, error } = await createAdminClient().from('quoaraai_goals').insert({ user_id: userId, title, project_id: projectId ?? null }).select('*').single();
  if (error) throw error;
  return data;
}
