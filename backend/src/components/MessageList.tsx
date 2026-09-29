'use client';

import { useEffect, useRef, useState } from 'react';

export interface UIMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

function CodeBlock({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);
  const match = raw.match(/^```([^\n]*)\n?([\s\S]*?)```$/);
  const language = match?.[1]?.trim() || 'code';
  const code = match?.[2] ?? raw;

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        <span>{language}</span>
        <button onClick={copy} className="rounded-lg px-2 py-1 normal-case tracking-normal text-zinc-400 transition hover:bg-white/10 hover:text-white">
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RichText({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('```') && part.endsWith('```') ? (
          <CodeBlock key={index} raw={part} />
        ) : (
          <div key={index} className="whitespace-pre-wrap break-words leading-7">
            {part}
          </div>
        ),
      )}
    </>
  );
}

export default function MessageList({
  messages,
  streaming = false,
}: {
  messages: UIMessage[];
  streaming?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function copyMessage(content: string, index: number) {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1200);
  }

  if (!messages.length) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
      {messages.map((message, index) => {
        const assistant = message.role === 'assistant';
        const waiting = assistant && !message.content && streaming && index === messages.length - 1;

        return (
          <article
            key={message.id ?? `${message.role}-${index}`}
            className={`group mb-7 flex ${assistant ? 'justify-start' : 'justify-end'}`}
          >
            {assistant && (
              <div className="mr-3 mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/25 to-cyan-400/10 text-sm font-black text-violet-200 shadow-lg shadow-violet-950/30 sm:flex">
                Q
              </div>
            )}

            <div className={assistant ? 'min-w-0 max-w-[92%] flex-1' : 'max-w-[88%] sm:max-w-[75%]'}>
              <div
                className={
                  assistant
                    ? 'min-w-0 text-[15px] text-zinc-100'
                    : 'rounded-[1.35rem] border border-white/10 bg-white/[0.075] px-4 py-3 text-[15px] text-zinc-100 shadow-xl shadow-black/10 backdrop-blur'
                }
              >
                {waiting ? (
                  <div className="flex h-8 items-center gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:160ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-300 [animation-delay:320ms]" />
                  </div>
                ) : (
                  <RichText content={message.content} />
                )}
              </div>

              {assistant && message.content && (
                <div className="mt-2 flex items-center gap-1 opacity-60 transition group-hover:opacity-100">
                  <button
                    onClick={() => copyMessage(message.content, index)}
                    className="rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
                  >
                    {copiedIndex === index ? 'Copied' : 'Copy'}
                  </button>
                  <span className="px-1 text-[10px] text-zinc-700">•</span>
                  <span className="px-2 py-1 text-[11px] text-zinc-600">QuoaraAi</span>
                </div>
              )}
            </div>
          </article>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
