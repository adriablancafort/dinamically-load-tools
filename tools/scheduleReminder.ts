import { tool } from 'ai';
import { z } from 'zod';

export const scheduleReminder = tool({
  description: 'Schedule a reminder for a specific time or date',
  inputSchema: z.object({
    message: z.string().describe('Reminder message'),
    time: z.string().describe('When to remind (e.g., "2 hours", "tomorrow")'),
  }),
  execute: async ({ message, time }) => {
    return { success: true, scheduled: time, message };
  },
});
