import { isOwnerIdentity } from '@/lib/auth/owner';
import { bodyTooLarge, isSameOriginMutation } from '@/lib/security/request';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const MAX_QUERY = 1000;
const MAX_RESULTS = 6;

type TavilyResult = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  score?: unknown;
};

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({ error: 'Cross-site request blocked.' }, { status: 403 });
  if (bodyTooLarge(request, 16_384)) return Response.json({ error: 'Request too large.' }, { status: 413 });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) return Response.json({ error: 'Owner access required.' }, { status: 403 });

  const admin = createAdminClient();
  const { data: allowed, error: limitError } = await admin.rpc('consume_chat_rate_limit', { p_user_id: data.user.id });
  if (limitError) return Response.json({ error: 'Rate limiter is unavailable.' }, { status: 503 });
  if (allowed !== true) return Response.json({ error: 'Rate limit exceeded.' }, { status: 429 });

  if (process.env.QUOARAAI_RESEARCH_ENABLED !== 'true') {
    return Response.json({ error: 'Research is installed but not activated.' }, { status: 503 });
  }
  if (process.env.QUOARAAI_RESEARCH_COST_MODE !== 'free_only') {
    return Response.json({ error: 'Research provider is not locked to an approved free-only mode.' }, { status: 503 });
  }

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return Response.json({ error: 'TAVILY_API_KEY is not configured.' }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Malformed JSON' }, { status: 400 }); }

  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const query = typeof value.query === 'string' ? value.query.trim() : '';
  if (!query || query.length > MAX_QUERY) return Response.json({ error: 'Invalid research query.' }, { status: 400 });

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: MAX_RESULTS,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return Response.json({ error: 'Free research allowance is unavailable or exhausted. No paid fallback was attempted.' }, { status: 429 });
      }
      return Response.json({ error: 'Research provider request failed.' }, { status: 502 });
    }

    const raw = await response.json() as { results?: TavilyResult[] };
    const results = (raw.results ?? []).slice(0, MAX_RESULTS).flatMap((item) => {
      if (typeof item.url !== 'string' || !/^https?:\/\//i.test(item.url)) return [];
      const content = typeof item.content === 'string' ? item.content.slice(0, 1800) : '';
      return [{
        title: typeof item.title === 'string' ? item.title.slice(0, 300) : item.url,
        url: item.url,
        content,
        score: typeof item.score === 'number' ? item.score : undefined,
      }];
    });

    return Response.json({ query, results, provider: 'tavily', costMode: 'free_only' }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('Research route error:', err);
    return Response.json({ error: 'Research request failed safely.' }, { status: 502 });
  }
}
