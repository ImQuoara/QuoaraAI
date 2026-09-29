import { redirect } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import Sidebar, { type ConversationSummary } from '@/components/Sidebar';
import { isOwnerIdentity } from '@/lib/auth/owner';
import { createClient } from '@/lib/supabase/server';

export default async function ChatPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !isOwnerIdentity(data.user)) redirect('/login');

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id,title,updated_at')
    .eq('user_id', data.user.id)
    .order('updated_at', { ascending: false });

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar conversations={(conversations ?? []) as ConversationSummary[]} currentId={null} />
      <ChatInterface conversationId={null} initialMessages={[]} />
    </div>
  );
}
