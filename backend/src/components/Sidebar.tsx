'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
}

export default function Sidebar({
  conversations,
  currentId,
}: {
  conversations: ConversationSummary[];
  currentId: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => conversation.title.toLowerCase().includes(needle));
  }, [conversations, query]);

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="hidden h-dvh w-[286px] shrink-0 flex-col border-r border-white/[0.07] bg-black/35 backdrop-blur-xl md:flex">
      <div className="p-3">
        <Link href="/chat" className="mb-3 flex items-center gap-3 rounded-2xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-500/25 to-cyan-300/10 font-black text-violet-200">
            Q
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide text-white">QuoaraAi</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Owner workspace</div>
          </div>
        </Link>

        <Link
          href="/chat"
          className="mb-3 flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-white/[0.055] px-3 text-sm text-zinc-200 transition hover:border-violet-400/25 hover:bg-violet-400/[0.07]"
        >
          <span>New chat</span>
          <span className="text-lg font-light text-zinc-500">＋</span>
        </Link>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-zinc-600">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="h-9 w-full rounded-xl border border-white/[0.07] bg-black/25 pl-8 pr-3 text-xs text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-violet-400/20"
          />
        </div>
      </div>

      <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
        Conversations
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length ? filtered.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/chat/${conversation.id}`}
            className={`mb-1 block truncate rounded-xl px-3 py-2.5 text-[13px] transition ${
              currentId === conversation.id
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-500 hover:bg-white/[0.045] hover:text-zinc-200'
            }`}
          >
            {conversation.title}
          </Link>
        )) : (
          <div className="px-3 py-4 text-xs text-zinc-700">No matching chats.</div>
        )}
      </nav>

      <div className="border-t border-white/[0.07] p-3">
        <div className="mb-2 grid grid-cols-3 gap-1">
          <Link href="/research" className="rounded-lg px-2 py-2 text-center text-[11px] text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300">Research</Link>
          <Link href="/projects" className="rounded-lg px-2 py-2 text-center text-[11px] text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300">Projects</Link>
          <Link href="/control" className="rounded-lg px-2 py-2 text-center text-[11px] text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300">Control</Link>
        </div>
        <button onClick={logout} className="w-full rounded-xl px-3 py-2 text-left text-xs text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300">
          Sign out
        </button>
      </div>
    </aside>
  );
}
