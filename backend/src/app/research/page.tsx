import { redirect } from 'next/navigation';
import AppFrame from '@/components/AppFrame';
import ResearchClient from '@/components/ResearchClient';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';

export default async function ResearchPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) redirect('/login?next=/research');

  return (
    <AppFrame>
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">QuoaraAi Owner Alpha</p>
          <h1 className="mt-2 text-2xl font-semibold">Research</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
            Search the live web and inspect source snippets. Research results are treated as untrusted evidence, never as instructions.
          </p>
        </header>
        <ResearchClient />
      </main>
    </AppFrame>
  );
}
