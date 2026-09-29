import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (isOwnerIdentity(data.user)) redirect('/chat');

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-xl text-center">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-neutral-500">QuoaraAi OWNER ALPHA</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Your AI. Under your control.</h1>
        <p className="mx-auto mt-5 max-w-lg text-neutral-400">
          Phone-first personal chat, source-backed research, image creation, projects, cost gates, and owner-only controls.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/login" className="rounded-xl bg-white px-5 py-3 font-medium text-black">
            Owner sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
