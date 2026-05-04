import { getDb } from '@/lib/db';
import { promptConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SYSTEM_PROMPT } from '@/lib/promptEngineer';

const CONFIG_KEY = 'llm_system_prompt';

export async function getActiveSystemPrompt(): Promise<{ text: string; source: 'db' | 'default' }> {
  try {
    const [row] = await getDb()
      .select()
      .from(promptConfig)
      .where(eq(promptConfig.configKey, CONFIG_KEY));
    if (row?.value?.trim()) {
      return { text: row.value, source: 'db' };
    }
  } catch {
    // DB unavailable — fall through to default
  }
  return { text: SYSTEM_PROMPT, source: 'default' };
}
