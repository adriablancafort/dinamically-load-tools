import { tool } from 'ai';
import { z } from 'zod';

export const calculateMath = tool({
  description: 'Calculate mathematical expressions or solve math problems',
  inputSchema: z.object({
    expression: z.string().describe('Mathematical expression to calculate'),
  }),
  execute: async ({ expression }) => {
    try {
      const result = eval(expression);
      return { expression, result };
    } catch (e) {
      return { error: 'Invalid expression' };
    }
  },
});
