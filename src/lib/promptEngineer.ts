import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { AestheticStyle } from '@/lib/validations/wizard';

export type GenerationMode = 'text-to-image' | 'image-to-image';

export interface EngineerInput {
  areas: string[];
  style: AestheticStyle;
  dreams: string;
  manifesto?: string;
  mode: GenerationMode;
}

export interface EngineeredPrompt {
  prompt: string;
  provider: 'openai' | 'anthropic' | 'template-fallback';
  model: string;
}

// ── Style vocabulary that gets woven into the LLM's instructions ──────────

const STYLE_DIRECTION: Record<AestheticStyle, string> = {
  minimal: 'Clean Scandinavian minimalism. White walls, natural light, uncluttered spaces, linen textures, muted warm neutrals (white, ivory, soft grey). Mood: calm, intentional, quietly successful.',
  vibrant: 'Bold, saturated, full-of-life palette. Rich greens, warm amber, cobalt blue, tropical tones. Strong natural sunlight, vivid contrasts. Mood: energetic, joyful, thriving.',
  ethereal: 'Soft dreamy romanticism. Pastel pinks, blush, lavender, warm ivory. Diffused golden light, lens flare, shallow depth of field with creamy bokeh. Mood: romantic, magical, luminous.',
  luxe: 'High-end editorial luxury. Warm golds, deep forest green, ivory, rich textures (marble, cashmere, leather). Moody directional light. Mood: opulent, powerful, refined.',
};

// ── The core system prompt ────────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are an expert Flux AI image prompt engineer. Convert the user’s dream-life description into one raw image prompt for a photorealistic Pinterest-style lifestyle vision board. Create a cohesive grid/mood board of 4–6 distinct lifestyle photographs. Each scene must feel already real, lived-in, cinematic, and specific to the user’s dreams — not generic luxury stock imagery. For each scene include: specific action + precise location/environment + lighting/time of day + grounded props/body language + emotional quality. Rules: - Pull directly from the user’s description. - Use 4–6 scenes separated by semicolons. - Maintain one cohesive aesthetic: warm, aspirational, editorial, realistic. - Use photographic language naturally: 35mm, shallow depth of field, cinematic color grade, golden hour, diffused window light. - For image-to-image mode, do not describe face, skin tone, or hair. Focus on actions, setting, wardrobe, props, and emotion. - Include subtle realism: messy table details, mid-laughter, wind movement, imperfect candid moments. - Total output: 250–380 words. - Return only the raw prompt. No preamble, labels, quotes, markdown, or explanation. Quality style example: cinematic lifestyle grid, warm-neutral palette, shallow depth of field, editorial realism; early morning meditation on a minimalist Manhattan balcony, skyline glowing through soft sunrise haze, linen curtains moving in the breeze, calm grounded energy; focused remote work from a glass-walled penthouse, laptop open, notebook and coffee nearby, relaxed posture, feeling of freedom and control; candid dinner with close friends on a rooftop terrace, candles, half-finished plates, city lights behind them, laughter mid-conversation, belonging and ease. Always end with: Photorealistic editorial lifestyle photography, ultra-detailed, cinematic quality, aspirational and warm. No text, no watermarks, no logos, no illustrated elements.`;

export const SYSTEM_PROMPT_1 = `You are a world-class AI image prompt engineer with deep expertise in Flux AI models and aspirational lifestyle photography. Your single job: convert a person's dream life into a devastatingly effective image generation prompt that produces a photorealistic lifestyle vision board.

## What you are creating
A Pinterest-style vision board / mood board — a grid of 4–6 distinct, photorealistic lifestyle photographs showing this person's dream life already happening. Not fantasy, not illustration, not generic stock imagery. Real, specific, cinematic moments.

## The formula for each scene
[Specific action] + [exact location with geographic/architectural detail] + [lighting condition] + [wardrobe/prop detail] + [emotional quality]

BAD: "relaxing at the beach"
GREAT: "a woman laughing with her eyes closed, sitting cross-legged in the shallows of a turquoise Maldivian lagoon, white sand, palm fronds overhead, warm golden-hour light hitting her face, wearing a flowing ivory linen co-ord"

## Rules
1. Pull directly from the person's manifesto and dreams — use their specific aspirations, not generic lifestyle tropes
2. Every scene must feel like it is ALREADY HAPPENING to this specific person
3. Include 4–6 scenes, comma-separated with semicolons between scenes
4. Match the aesthetic style in every detail: lighting, color palette, texture, mood
5. Use photographic language: f/1.4 bokeh, 35mm, golden hour, diffused window light, cinematic color grade
6. For image-to-image mode: do NOT describe the person's face, skin tone, or hair — the reference photo handles that. Describe ENVIRONMENTS and what they are DOING
7. Total length: 250–380 words

## Output format
Return ONLY the raw prompt text. No preamble, no explanation, no quotes wrapping the output. Start directly with the vision board layout, style and then description.

## Always end with this exact line
Photorealistic editorial lifestyle photography, ultra-detailed, cinematic quality, aspirational and warm. No text, no watermarks, no logos, no illustrated elements.`;

// ── Build the user turn ───────────────────────────────────────────────────

export function buildUserMessage(input: EngineerInput): string {
  const { areas, style, dreams, manifesto, mode } = input;

  return [
    `Life areas to visualize: ${areas.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}`,
    `Aesthetic style: ${style}`,
    `Style direction: ${STYLE_DIRECTION[style]}`,
    ``,
    `Their dream life (in their own words):`,
    dreams.trim(),
    ``,
    manifesto ? `Their personal manifesto: "${manifesto.trim()}"` : null,
    ``,
    `Generation mode: ${mode === 'image-to-image'
      ? 'image-to-image — the user\'s face/appearance comes from a reference photo. Focus entirely on scenes, environments, activities, and atmosphere. Do NOT describe what the person looks like.'
      : 'text-to-image — show aspirational people (use "she", "he", or "they" naturally) living this life in each scene'}`,
  ].filter(Boolean).join('\n');
}

// ── Main export ───────────────────────────────────────────────────────────

export async function engineerPrompt(
  input: EngineerInput,
  systemPromptOverride?: string,
): Promise<EngineeredPrompt> {
  const userMessage = buildUserMessage(input);
  const systemPrompt = systemPromptOverride ?? SYSTEM_PROMPT;

  // Try OpenAI first (gpt-4o-mini: fast, cheap, excellent instruction follower)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userMessage,
        maxOutputTokens: 700,
        temperature: 0.85,
      });
      return { prompt: text.trim(), provider: 'openai', model: 'gpt-4o-mini' };
    } catch (err) {
      console.error('[promptEngineer] OpenAI failed:', err);
    }
  }

  // Fallback to Anthropic if key is present
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { text } = await generateText({
        model: anthropic('claude-haiku-4-5-20251001'),
        system: systemPrompt,
        prompt: userMessage,
        maxOutputTokens: 700,
        temperature: 0.85,
      });
      return { prompt: text.trim(), provider: 'anthropic', model: 'claude-haiku-4-5-20251001' };
    } catch (err) {
      console.error('[promptEngineer] Anthropic failed:', err);
    }
  }

  // No LLM provider available
  throw new Error('No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
}

/** True if at least one LLM provider key is configured. */
export function isLLMAvailable(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}
