import Link from 'next/link';
import { redirect } from 'next/navigation';
import AppFrame from '@/components/AppFrame';
import ProjectsClient from '@/components/ProjectsClient';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) redirect('/login?next=/projects');

  return (
    <AppFrame>
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">QuoaraAi Owner Alpha</p>
            <h1 className="mt-2 text-2xl font-semibold">Projects</h1>
          </div>
          <Link href="/chat" className="hidden rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900 md:block">Chat</Link>
        </header>
        <ProjectsClient />
      </main>
    </AppFrame>
  );
}
