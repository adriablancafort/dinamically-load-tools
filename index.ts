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
  execute: async ({ taskDescription }) => {
    const usefulTools = await searchTools(taskDescription, 3);

    const toolNames = Object.keys(usefulTools);

    if (toolNames.length === 0) {
      return {
        message: "I don't have the appropriate tools to help with that task.",
      };
    }
    
    tools = { finishTask, ...usefulTools };
    
    console.log(`\n🔧 [Task Started] Loaded tools: ${toolNames.join(', ')}`);
        
    return {
      message: `Tools loaded: ${toolNames.join(', ')}. Use them to complete the task.`,
    };
  },
});

const finishTask = tool({
  description: 'Call this tool when the task is completed or needs to be ended. This will unload the task-specific tools.',
  inputSchema: z.object({
    success: z.boolean().describe('Whether the task was completed successfully'),
    summary: z.string().describe('A brief summary of what was accomplished or why the task failed'),
  }),
  execute: async ({ success, summary }) => {
    const previousTools = Object.keys(tools).filter(t => t !== 'finishTask');
    
    tools = { startTask };
    
    console.log(`\n${success ? '✅' : '❌'} [Task ${success ? 'Complete' : 'Failed'}] ${summary}`);
    console.log(`🗑️  Unloaded: ${previousTools.join(', ')}\n`);
    
    return {
      success,
      summary,
      message: 'Tools unloaded. Ready for a new task.',
    };
  },
});

async function main() {
  console.log('Initializing tool embeddings...');
  await initializeToolEmbeddings();

  tools = { startTask };

  while (true) {
    const userInput = await terminal.question('\nYou: ');

    messages.push({ role: 'user', content: userInput });

    process.stdout.write('\nAssistant: ');
    
    while (true) {
      const result = streamText({
        model: openai('gpt-4o-mini'),
        system: `You are a helpful assistant. Follow this workflow:

1. startTask
2. Use available tools to handle the task if possible
3. finishTask
4. generate a text response`,
        messages,
        tools,
      });

      let generatedText = false;
      for await (const delta of result.textStream) {
        generatedText = true;
        process.stdout.write(delta);
      }

      const response = await result.response;
      messages.push(...response.messages);
      
      if (generatedText) break;
    }
    
    process.stdout.write('\n');
  }
}

main()