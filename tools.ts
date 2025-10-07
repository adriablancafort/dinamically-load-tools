import { openai } from '@ai-sdk/openai';
import { embed, embedMany, cosineSimilarity } from 'ai';
import { sendEmail } from './tools/sendEmail';
import { weather } from './tools/weather';
import { searchWeb } from './tools/searchWeb';
import { calculateMath } from './tools/calculateMath';
import { scheduleReminder } from './tools/scheduleReminder';

const allTools = { sendEmail, weather, searchWeb, calculateMath, scheduleReminder };

const toolRegistry = Object.entries(allTools).map(([name, tool]) => ({
  name,
  tool,
  embedding: undefined as number[] | undefined,
}));

export async function initializeToolEmbeddings() {
  const descriptions = toolRegistry.map(t => t.tool.description);
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: descriptions,
  });
  
  toolRegistry.forEach((tool, i) => {
    tool.embedding = embeddings[i];
  });
}

export async function searchTools(userQuery: string, topK: number = 3): Promise<Record<string, any>> {
  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: userQuery,
  });
  
  return toolRegistry
    .map(toolMeta => ({
      toolMeta,
      score: toolMeta.embedding ? cosineSimilarity(queryEmbedding, toolMeta.embedding) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(({ score }) => score > 0.3)
    .reduce((tools, { toolMeta }) => {
      tools[toolMeta.name] = toolMeta.tool;
      return tools;
    }, {} as Record<string, any>);
}
