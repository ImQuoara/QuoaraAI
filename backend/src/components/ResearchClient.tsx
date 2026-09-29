'use client';

import { useState } from 'react';

type ResearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

type ResearchPayload = {
  query: string;
  results: ResearchResult[];
  provider: string;
  costMode: string;
};

export default function ResearchClient() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ResearchPayload | null>(null);

  async function run(event: React.FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    setPayload(null);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean }),
      });
      const next = await response.json().catch(() => null);
      if (!response.ok) throw new Error(next?.error ?? 'Research failed.');
      setPayload(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={run} className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6">
        <label htmlFor="research-query" className="text-sm text-neutral-300">What do you want researched?</label>
        <textarea
          id="research-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Research a current topic…"
          className="mt-2 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-400"
        />
        <div className="mt-4 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4 text-xs leading-5 text-emerald-100">
          Pressing “Search sources” sends only this query to Tavily. This build accepts only Tavily's no-card free tier; if the provider is not locked to free-only mode, QuoaraAi refuses to run it.
        </div>
        {error && <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}
        <button disabled={!query.trim() || busy} className="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-medium text-black disabled:opacity-40">
          {busy ? 'Researching…' : 'Search sources'}
        </button>
      </form>

      {payload && (
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/30 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Sources</h2>
            <span className="text-xs text-neutral-500">{payload.provider} · {payload.costMode}</span>
          </div>
          <div className="mt-5 space-y-3">
            {payload.results.map((item) => (
              <article key={item.url} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <a href={item.url} target="_blank" rel="noreferrer noopener" className="font-medium text-neutral-100 underline decoration-neutral-700 underline-offset-4 hover:decoration-neutral-300">
                  {item.title || item.url}
                </a>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{item.content}</p>
                <p className="mt-2 break-all text-xs text-neutral-600">{item.url}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
