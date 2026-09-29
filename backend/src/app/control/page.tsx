import Link from 'next/link';
import AppFrame from '@/components/AppFrame';
import { redirect } from 'next/navigation';
import { QUOARAAI_CAPABILITIES } from '@/quoaraai';
import { isOwnerIdentity, ownerConfigurationReady } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';

function status(value: boolean) {
  return value ? 'Ready' : 'Off';
}

export default async function ControlPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) redirect('/login?next=/control');

  const system = [
    { name: 'Owner lock', value: status(ownerConfigurationReady()), detail: 'Only QUOARAAI_OWNER_USER_ID may use protected pages and APIs.' },
    { name: 'Chat', value: status(process.env.QUOARAAI_CHAT_ENABLED === 'true' && process.env.QUOARAAI_CHAT_COST_MODE === 'free_only'), detail: 'Runs only when explicitly configured as free-only.' },
    { name: 'Research', value: status(process.env.QUOARAAI_RESEARCH_ENABLED === 'true' && process.env.QUOARAAI_RESEARCH_COST_MODE === 'free_only' && Boolean(process.env.TAVILY_API_KEY)), detail: 'Tavily free-tier adapter; no paid fallback.' },
    { name: 'Image', value: status(process.env.QUOARAAI_IMAGE_GENERATION_ENABLED === 'true' && process.env.QUOARAAI_IMAGE_COST_MODE === 'free_only'), detail: 'Free-only Cloudflare image route; no paid fallback and exact-action approval required.' },
    { name: 'Adult boundary', value: 'Ready', detail: 'Lawful adult prompts are not blanket blocked by QuoaraAi, but minors, coercive sexual content, and exploitation are blocked.' },
  ];

  return (
    <AppFrame>
      <main className="min-h-screen bg-neutral-950 px-5 py-8 text-neutral-100">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">QuoaraAi Owner Alpha</p>
              <h1 className="mt-2 text-3xl font-semibold">Control Center</h1>
              <p className="mt-2 max-w-3xl text-sm text-neutral-400">Owner-only controls, no silent spending, no autonomous upgrades, and no external write authority.</p>
            </div>
            <Link href="/chat" className="hidden rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900 sm:block">Chat</Link>
          </div>

          <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {system.map((item) => (
              <article key={item.name} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-medium">{item.name}</h2>
                  <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${item.value === 'Ready' ? 'border-emerald-900 text-emerald-300' : 'border-neutral-700 text-neutral-500'}`}>{item.value}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-neutral-500">{item.detail}</p>
              </article>
            ))}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {QUOARAAI_CAPABILITIES.map((capability) => (
              <section key={capability.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium">{capability.name}</h2>
                  <span className="rounded-full border border-neutral-700 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">{capability.status.replace('_', ' ')}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-400">{capability.description}</p>
                {capability.approvalRequiredForSideEffects && <p className="mt-3 text-xs text-amber-300">Owner approval required for side effects.</p>}
              </section>
            ))}
          </div>
        </div>
      </main>
    </AppFrame>
  );
}
