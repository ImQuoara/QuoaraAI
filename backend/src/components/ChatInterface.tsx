'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MessageComposer from './MessageComposer';
import AppNav from './AppNav';
import MessageList, { type UIMessage } from './MessageList';

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
    setBusy(true);
    setError(null);
    setMessages((current) => [...current, { role: 'user', content: message }]);

    try {
      const id = await ensureConversation(message);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, message }),
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
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-neutral-950 pb-20 md:pb-0">
      <header className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
        <LinkHome />
        <div className="flex items-center gap-3">
          <Link href="/control" className="text-xs text-neutral-400 hover:text-neutral-200">Control Center</Link>
          <span className="text-xs text-neutral-500">Owner Alpha</span>
        </div>
      </header>
      {error && <div className="mx-4 mt-3 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>
      <MessageComposer disabled={busy} onSend={send} />
      <AppNav />
    </main>
  );
}

function LinkHome() {
  return (
    <Link href="/chat" className="font-semibold tracking-wide">
      QuoaraAi
    </Link>
  );
}
