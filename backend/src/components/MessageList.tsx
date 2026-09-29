export interface UIMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function MessageList({ messages }: { messages: UIMessage[] }) {
  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-neutral-500">
        Start a conversation.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      {messages.map((message, index) => (
        <div
          key={message.id ?? `${message.role}-${index}`}
          className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
        >
          <div className={message.role === 'user'
            ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-black'
            : 'max-w-[90%] whitespace-pre-wrap rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-neutral-100'}>
            {message.content}
          </div>
        </div>
      ))}
    </div>
  );
}
