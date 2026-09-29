'use client';

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

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900 md:flex">
      <div className="space-y-2 p-3">
        <Link href="/chat" className="block rounded-xl border border-neutral-700 px-4 py-3 text-center font-medium hover:bg-neutral-800">
          + New chat
        </Link>
        <div className="grid grid-cols-3 gap-1">
          <Link href="/create" className="rounded-lg px-2 py-2 text-center text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white">Create</Link>
          <Link href="/projects" className="rounded-lg px-2 py-2 text-center text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white">Projects</Link>
          <Link href="/control" className="rounded-lg px-2 py-2 text-center text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white">Control</Link>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/chat/${conversation.id}`}
            className={`mb-1 block truncate rounded-lg px-3 py-2 text-sm ${
              currentId === conversation.id ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            {conversation.title}
          </Link>
        ))}
      </nav>
      <button onClick={logout} className="m-3 rounded-xl border border-neutral-700 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-800">
        Sign out
      </button>
    </aside>
  );
}
