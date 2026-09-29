import { notFound, redirect } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import Sidebar, { type ConversationSummary } from '@/components/Sidebar';
import type { UIMessage } from '@/components/MessageList';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(auth.user)) redirect('/login');

  const [{ data: conversations }, { data: conversation }, { data: messages }] = await Promise.all([
    supabase.from('conversations').select('id,title,updated_at').eq('user_id', auth.user.id).order('updated_at', { ascending: false }),
    supabase.from('conversations').select('id').eq('id', id).eq('user_id', auth.user.id).maybeSingle(),
    supabase.from('messages').select('id,role,content,created_at').eq('conversation_id', id).order('created_at', { ascending: true }),
  ]);

  if (!conversation) notFound();

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar conversations={(conversations ?? []) as ConversationSummary[]} currentId={id} />
      <ChatInterface conversationId={id} initialMessages={(messages ?? []) as UIMessage[]} />
    </div>
  );
}
