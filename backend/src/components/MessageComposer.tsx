'use client';

import { useEffect, useRef, useState } from 'react';

const STARTERS = ['Build an app', 'Debug code', 'Explain code', 'Plan a feature'];

export default function MessageComposer({
  disabled,
  onSend,
  onStop,
}: {
  disabled: boolean;
  onSend(message: string): Promise<void>;
  onStop(): void;
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = value.trim();
    if (!message || disabled) return;
    setValue('');
    await onSend(message);
  }

  return (
    <div className="bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {!value && !disabled && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => {
                  setValue(starter + ': ');
                  requestAnimationFrame(() => textareaRef.current?.focus());
                }}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-zinc-500 transition hover:border-violet-400/30 hover:bg-violet-400/[0.07] hover:text-zinc-200"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={submit}
          className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-zinc-900/85 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl transition focus-within:border-violet-400/30 focus-within:shadow-[0_18px_80px_rgba(88,28,135,0.16)]"
        >
          <textarea
            ref={textareaRef}
            aria-label="Message QuoaraAi"
            value={value}
            maxLength={10_000}
            rows={1}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask Quoara anything…"
            className="min-h-[58px] max-h-[180px] w-full resize-none bg-transparent px-5 pb-4 pr-16 pt-4 text-[15px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"
          />

          <div className="absolute bottom-2.5 right-2.5">
            {disabled ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 shadow-lg transition hover:scale-[1.03]"
              >
                <span className="h-3 w-3 rounded-[3px] bg-zinc-950" />
              </button>
            ) : (
              <button
                disabled={!value.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-300 to-cyan-200 font-black text-zinc-950 shadow-lg shadow-violet-950/30 transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-25"
              >
                ↑
              </button>
            )}
          </div>
        </form>

        <p className="mt-2 text-center text-[10px] tracking-wide text-zinc-700">
          Quoara can make mistakes. Verified actions stay owner-controlled.
        </p>
      </div>
    </div>
  );
}
