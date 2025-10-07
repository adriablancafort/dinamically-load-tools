import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText, tool } from 'ai';
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';
import { initializeToolEmbeddings, searchTools } from './tools';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

let tools: Record<string, any> = {};

const startTask = tool({
  description: 'Call this when the user wants to accomplish a task. This will find and load the appropriate tools needed for the task.',
  inputSchema: z.object({
    taskDescription: z.string().describe('A clear description of what the user wants to accomplish'),
  }),
  outputSchema: z.object({
    message: z.string().describe('A message indicating the result of starting the task'),
  }),
  execute: async ({ taskDescription }) => {
    const relevantTools = await searchTools(taskDescription, 3);
    
    if (Object.keys(relevantTools).length === 0) {
      return {
        message: "I don't have the appropriate tools to help with that task.",
      };
    }
    
    tools = {
      ...relevantTools,
      finishTask,
    };
        
    return {
      message: `I've loaded ${Object.keys(relevantTools).join(', ')} tool(s) to help with this task.`,
    };
  },
});

const finishTask = tool({
  description: 'Call this tool when the task is completed or needs to be ended.',
  inputSchema: z.object({
    success: z.boolean().describe('Whether the task was completed successfully'),
    summary: z.string().describe('A brief summary of what was accomplished or why the task failed'),
  }),
  execute: async ({ success, summary }) => {
    tools = { startTask };
    
    return {
      success,
      summary,
    };
  },
});

async function main() {
  await initializeToolEmbeddings();
  
  tools = { startTask };

  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are a helpful assistant that helps the user complete tasks.`,
      messages,
      tools
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main()