export const MAX_TITLE_LENGTH = 100;

export interface ConversationDeps {
  getUser(): Promise<{ id: string } | null>;
  list(userId: string): Promise<unknown[]>;
  create(userId: string, title: string): Promise<unknown>;
}

export function validateTitle(value: unknown) {
  if (value === undefined) return 'New Conversation';
  if (typeof value !== 'string') return null;
  const title = value.trim();
  if (!title || title.length > MAX_TITLE_LENGTH) return null;
  return title;
}

export function createConversationHandlers(deps: ConversationDeps) {
  async function GET() {
    const user = await deps.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json(await deps.list(user.id));
  }

  async function POST(request: Request) {
    const user = await deps.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Malformed JSON' }, { status: 400 });
    }

    const title = validateTitle(
      body && typeof body === 'object' ? (body as Record<string, unknown>).title : undefined,
    );
    if (!title) return Response.json({ error: 'Invalid title' }, { status: 400 });

    return Response.json(await deps.create(user.id, title), { status: 201 });
  }

  return { GET, POST };
}
