'use client';

import { useMemo, useState } from 'react';

const ASPECTS = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const;
const MODES = [
  { id: 'auto', label: 'Auto Free', detail: 'QuoaraAi chooses Flux or Leonardo inside the approved free pool.' },
  { id: 'fast', label: 'Fast Free', detail: 'Flux Schnell: very low free-quota usage.' },
  { id: 'leonardo', label: 'Leonardo Free', detail: 'Leonardo Phoenix first, Flux fallback if unavailable.' },
] as const;

type Prepared = {
  actionRequestId: string;
  estimatedCostUsd: number;
  provider: string;
  models: string[];
  primaryModel?: string;
  mode: string;
  expiresAt: string;
  actionHash: string;
};

type ImageResult = {
  dataUrl: string;
  model: string;
  provider: string;
  estimatedCostUsd: number;
  estimatedNeurons?: number;
};

export default function ImageCreator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECTS)[number]>('1:1');
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('auto');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedPrompt = useMemo(() => prompt.trim(), [prompt]);

  async function prepare() {
    setBusy(true);
    setError(null);
    setResult(null);
    setPrepared(null);
    try {
      const response = await fetch('/api/image/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: normalizedPrompt, aspectRatio, mode }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Could not prepare image action.');
      setPrepared(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare image action.');
    } finally {
      setBusy(false);
    }
  }

  async function approveAndGenerate() {
    if (!prepared) return;
    setBusy(true);
    setError(null);
    try {
      const approve = await fetch('/api/quoaraai/actions/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prepared.actionRequestId, decision: 'approved' }),
      });
      const approvalPayload = await approve.json().catch(() => null);
      if (!approve.ok) throw new Error(approvalPayload?.error ?? 'Approval could not be recorded.');

      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionRequestId: prepared.actionRequestId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Image generation failed.');
      setResult(payload);
      setPrepared(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Image creator</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Create without crossing the $0 line.</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          QuoaraAi uses only the owner-approved Cloudflare Workers AI free allocation. Auto Free can route between Flux and Leonardo Phoenix. If the free allowance is unavailable, QuoaraAi stops instead of using a paid fallback. Lawful adult prompts are not blanket-blocked by QuoaraAi, but minors, sexual exploitation, and non-consensual sexual content are blocked, and provider-side rules still apply.
        </p>

        <label className="mt-6 block text-sm text-neutral-300" htmlFor="image-prompt">Prompt</label>
        <textarea
          id="image-prompt"
          value={prompt}
          onChange={(event) => { setPrompt(event.target.value); setPrepared(null); }}
          maxLength={2048}
          rows={8}
          placeholder="Describe the image you want…"
          className="mt-2 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none transition focus:border-neutral-400"
        />

        <div className="mt-4">
          <p className="text-sm text-neutral-300">Free routing</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setMode(item.id); setPrepared(null); }}
                className={`rounded-xl border px-3 py-3 text-left text-xs ${mode === item.id ? 'border-white bg-white text-black' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
              >
                <span className="block font-semibold">{item.label}</span>
                <span className={`mt-1 block leading-4 ${mode === item.id ? 'text-black/70' : 'text-neutral-500'}`}>{item.detail}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-neutral-300">Aspect ratio</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASPECTS.map((aspect) => (
              <button
                key={aspect}
                type="button"
                onClick={() => { setAspectRatio(aspect); setPrepared(null); }}
                className={`rounded-xl border px-3 py-2 text-xs ${aspectRatio === aspect ? 'border-white bg-white text-black' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}
              >
                {aspect}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}

        {!prepared ? (
          <button
            type="button"
            disabled={!normalizedPrompt || busy}
            onClick={prepare}
            className="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-medium text-black disabled:opacity-40"
          >
            {busy ? 'Preparing…' : 'Prepare free generation'}
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4">
            <p className="text-sm font-medium text-emerald-100">Approve this exact external generation?</p>
            <p className="mt-2 text-xs leading-5 text-emerald-100/80">
              Provider cost ceiling: US$0.0000. Route: {prepared.mode}. Primary: {prepared.primaryModel ?? prepared.models[0]}. QuoaraAi may use only the listed free fallback model(s) in this approved action. The approval is single-use and expires automatically. Provider-side content rules still apply.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setPrepared(null)} className="rounded-xl border border-neutral-700 px-4 py-3 text-sm text-neutral-300">Cancel</button>
              <button type="button" disabled={busy} onClick={approveAndGenerate} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-40">{busy ? 'Generating…' : 'Approve & generate'}</button>
            </div>
          </div>
        )}
      </section>

      <section className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/30 p-4">
        {result ? (
          <div className="w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.dataUrl} alt="Generated by QuoaraAi" className="mx-auto max-h-[70vh] w-auto max-w-full rounded-2xl object-contain" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
              <span>{result.model}</span>
              <span>Provider cost: US$0.0000{typeof result.estimatedNeurons === 'number' ? ` · ~${Math.ceil(result.estimatedNeurons)} free neurons` : ''}</span>
            </div>
          </div>
        ) : (
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950 text-2xl">◇</div>
            <p className="mt-4 font-medium text-neutral-300">Your generation will appear here.</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">No paid provider fallback exists in this route.</p>
          </div>
        )}
      </section>
    </div>
  );
}
