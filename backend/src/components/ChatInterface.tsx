'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MessageComposer from './MessageComposer';
import AppNav from './AppNav';
import MessageList, { type UIMessage } from './MessageList';

const SUGGESTIONS = [
  ['Build', 'Build me a clean mobile-first app feature and explain the architecture.'],
  ['Code', 'Write production-ready code for an idea I describe.'],
  ['Debug', 'Help me debug an error and show the exact fix.'],
  ['Plan', 'Turn my idea into a technical build plan with the next action.'],
] as const;

export default function ChatInterface({
  conversationId,
  initialMessages,
}: {
  conversationId: string | null;
  initialMessages: UIMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  async function ensureConversation(firstMessage: string) {
    if (conversationId) return conversationId;

    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: firstMessage.slice(0, 80) }),
    });

    if (!response.ok) throw new Error('Could not create conversation.');
    const conversation = await response.json();
    router.replace(`/chat/${conversation.id}`);
    return conversation.id as string;
  }

  async function send(message: string) {
    if (busy) return;

    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setError(null);
    setMessages((current) => [...current, { role: 'user', content: message }]);

    try {
      const id = await ensureConversation(message);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, message }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Chat request failed.');
      }

      setMessages((current) => [...current, { role: 'assistant', content: '' }]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: last.content + text };
          return next;
        });
      }

      router.refresh();
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      setBusy(false);
    }
  }

  function stop() {
    requestRef.current?.abort();
    requestRef.current = null;
    setBusy(false);
  }

  const empty = messages.length === 0;

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#09090b] pb-20 md:pb-0">
      <div className="pointer-events-none absolute inset-0 quoara-grid opacity-35" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-3xl" />

      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#09090b]/75 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-semibold tracking-tight text-zinc-100">Quoara</span>
          <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2 py-1 text-[10px] font-medium text-emerald-300/80 sm:inline">
            Universal Coding Engine
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/projects" className="rounded-lg px-2.5 py-2 text-xs text-zinc-600 transition hover:bg-white/5 hover:text-zinc-200">Projects</Link>
          <Link href="/control" className="rounded-lg px-2.5 py-2 text-xs text-zinc-600 transition hover:bg-white/5 hover:text-zinc-200">Control</Link>
        </div>
      </header>

      {error && (
        <div className="relative z-20 mx-auto mt-3 w-[calc(100%-2rem)] max-w-4xl rounded-xl border border-red-400/20 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center px-5 py-10 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-violet-400/20 bg-gradient-to-br from-violet-500/20 via-fuchsia-400/10 to-cyan-300/10 text-2xl font-black text-violet-100 shadow-[0_0_70px_rgba(124,58,237,0.15)]">
              Q
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-700">QuoaraAi</p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-zinc-100 sm:text-5xl">
              What are we building?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
              Chat, code, plan and iterate in one workspace. When Quoara cannot verify something, it will tell you exactly what to ask next.
            </p>

            <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map(([label, prompt]) => (
                <button
                  key={label}
                  onClick={() => void send(prompt)}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-400/20 hover:bg-violet-400/[0.05]"
                >
                  <div className="mb-1 text-xs font-semibold text-zinc-300">{label}</div>
                  <div className="text-xs leading-5 text-zinc-600 group-hover:text-zinc-500">{prompt}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <MessageList messages={messages} streaming={busy} />
        )}
      </div>

      <div className="relative z-20 shrink-0">
        <MessageComposer disabled={busy} onSend={send} onStop={stop} />
      </div>
      <AppNav />
    </main>
  );
}
