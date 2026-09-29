export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface AIProvider {
  streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>>;
  generate(messages: ChatMessage[]): Promise<string>;
}
