import { openai } from '@ai-sdk/openai';
import { embed, embedMany, cosineSimilarity } from 'ai';
import { sendEmail } from './tools/sendEmail';
import { weather } from './tools/weather';
import { searchWeb } from './tools/searchWeb';
import { calculateMath } from './tools/calculateMath';
import { scheduleReminder } from './tools/scheduleReminder';

interface ToolMetadata {
  name: string;
  tool: any;
  embedding?: number[];
}

const allTools = { sendEmail, weather, searchWeb, calculateMath, scheduleReminder };
const toolRegistry: ToolMetadata[] = Object.entries(allTools).map(([name, tool]) => ({
  name,
  tool,
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
  
  const toolScores = toolRegistry.map(toolMeta => ({
    toolMeta,
    score: toolMeta.embedding ? cosineSimilarity(queryEmbedding, toolMeta.embedding) : 0,
  }));
  
  toolScores.sort((a, b) => b.score - a.score);
  const topTools = toolScores.slice(0, topK);
  
  const relevantTools: Record<string, any> = {};
  topTools
    .filter(({ score }) => score > 0.3)
    .forEach(({ toolMeta }) => {
      relevantTools[toolMeta.name] = toolMeta.tool;
    });
  
  return relevantTools;
}
