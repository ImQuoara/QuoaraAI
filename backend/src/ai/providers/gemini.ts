import { GoogleGenAI } from '@google/genai';
import type { AIProvider, ChatMessage } from '../provider';

export function toInteractionInput(messages: ChatMessage[]) {
  return messages.map((message) =>
    message.role === 'user'
      ? {
          type: 'user_input' as const,
          content: [{ type: 'text' as const, text: message.content }],
        }
      : {
          type: 'model_output' as const,
          content: [{ type: 'text' as const, text: message.content }],
        },
  );
}

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI | null = null;
  private readonly model: string;

  constructor(model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite') {
    this.model = model;
  }

  private getClient() {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  async streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
    const responseStream = await this.getClient().interactions.create({
      model: this.model,
      input: toInteractionInput(messages),
      store: false,
      stream: true,
    });

    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of responseStream) {
            if (event.event_type === 'step.delta' && event.delta.type === 'text') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  async generate(messages: ChatMessage[]): Promise<string> {
    const interaction = await this.getClient().interactions.create({
      model: this.model,
      input: toInteractionInput(messages),
      store: false,
    });

    return interaction.output_text ?? '';
  }
}
