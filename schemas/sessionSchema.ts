import { z } from 'zod';

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'model', 'system']),
  content: z.string(),
  timestamp: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  isError: z.boolean().optional(),
  relatedData: z.any().optional(),
  trace: z.array(z.string()).optional(),
});

export const ChatSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  messages: z.array(ChatMessageSchema),
  timestamp: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  pinned: z.boolean().optional(),
});

export const ChatSessionsArraySchema = z.array(ChatSessionSchema);

export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
