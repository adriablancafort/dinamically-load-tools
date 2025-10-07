import { tool } from 'ai';
import { z } from 'zod';

export const searchWeb = tool({
  description: 'Search the web for information about a topic',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }) => {
    return { results: `Mock results for: ${query}` };
  },
});
