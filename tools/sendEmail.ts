import { tool } from 'ai';
import { z } from 'zod';

export const sendEmail = tool({
  description: 'Send an email to a recipient with a subject and body',
  inputSchema: z.object({
    to: z.string().describe('Email recipient'),
    subject: z.string().describe('Email subject'),
    body: z.string().describe('Email body'),
  }),
  execute: async ({ to, subject, body }) => {
    return { success: true, message: `Email sent to ${to}` };
  },
});
