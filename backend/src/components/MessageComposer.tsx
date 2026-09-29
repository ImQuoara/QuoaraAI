'use client';

import { useState } from 'react';

export default function MessageComposer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend(message: string): Promise<void>;
}) {
  const [value, setValue] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const message = value.trim();
    if (!message || disabled) return;
    setValue('');
    await onSend(message);
  }

  return (
    <form onSubmit={submit} className="border-t border-neutral-800 bg-neutral-950 p-3">
      <div className="mx-auto flex max-w-3xl gap-2">
        <textarea
          aria-label="Message"
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
          placeholder="Message QuoaraAi"
          className="min-h-12 flex-1 resize-none rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 outline-none focus:border-neutral-400"
        />
        <button disabled={disabled || !value.trim()} className="rounded-2xl bg-white px-5 font-medium text-black disabled:opacity-40">
          {disabled ? '…' : 'Send'}
        </button>
      </div>
    </form>
  );
}
