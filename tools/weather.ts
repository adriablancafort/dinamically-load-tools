import { tool } from 'ai';
import { z } from 'zod';

export const weather = tool({
  description: 'Get the current weather in a specific location',
  inputSchema: z.object({
    location: z.string().describe('The location to get weather for'),
  }),
  execute: async ({ location }) => {
    const temperature = Math.round(Math.random() * (90 - 32) + 32);
    return { location, temperature, unit: 'fahrenheit' };
  },
});
