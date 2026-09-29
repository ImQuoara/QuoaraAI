import Link from 'next/link';
import AppFrame from '@/components/AppFrame';
import { redirect } from 'next/navigation';
import { QUOARAAI_CAPABILITIES } from '@/quoaraai';
import { isOwnerIdentity, ownerConfigurationReady } from '@/lib/auth/owner';
import { providerRegistry, type ProviderStatus } from '@/providers/registry';
import { createClient } from '@/lib/supabase/server';

function ready(value: boolean) {
  return value ? 'Ready' : 'Off';
}

function badge(status: ProviderStatus) {
  switch (status) {
    case 'ready': return 'border-emerald-900 text-emerald-300';
    case 'needs_configuration': return 'border-amber-900 text-amber-300';
    case 'blocked': return 'border-red-900 text-red-300';
    default: return 'border-neutral-700 text-neutral-500';
  }
}

export default async function ControlPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) redirect('/login?next=/control');

  const providers = providerRegistry();
  const system = [
    { name: 'Owner lock', value: ready(ownerConfigurationReady()), detail: 'Only QUOARAAI_OWNER_USER_ID may use protected pages and APIs.' },
    { name: 'Signed approvals', value: ready(process.env.QUOARAAI_DEVICE_SIGNED_APPROVALS_REQUIRED === 'true'), detail: 'External image actions require an Android Keystore signature when enabled.' },
    { name: 'Paid fallback', value: 'Off', detail: 'No automatic paid/provider fallback is permitted in this release.' },
  ];

  return (
    <AppFrame>
      <main className="min-h-screen bg-neutral-950 px-5 py-8 text-neutral-100">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">QuoaraAi 002A final candidate</p>
              <h1 className="mt-2 text-3xl font-semibold">Control Center</h1>
              <p className="mt-2 max-w-3xl text-sm text-neutral-400">Owner-only controls, no silent spending, no autonomous upgrades, and no external write authority.</p>
            </div>
            <Link href="/chat" className="hidden rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-900 sm:block">Chat</Link>
          </div>

          <section className="mb-6 grid gap-3 sm:grid-cols-3">
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

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-medium">Provider connections</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {providers.map((item) => (
                <article key={item.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">{item.capability}</p>
                      <h3 className="mt-1 font-medium">{item.displayName}</h3>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${badge(item.status)}`}>
                      {item.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-400">{item.reason}</p>
                  <p className="mt-2 text-xs text-neutral-600">Cost mode: {item.costMode.replaceAll('_', ' ')}</p>
                </article>
              ))}
            </div>
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
