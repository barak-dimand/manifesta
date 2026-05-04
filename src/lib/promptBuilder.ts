import type { AestheticStyle } from '@/lib/validations/wizard';

// ── Mode ─────────────────────────────────────────────────────────────────────
export type GenerationMode = 'text-to-image' | 'image-to-image';

// ── Templates — use {{VARIABLE}} placeholders ─────────────────────────────────

export const TEXT_TO_IMAGE_TEMPLATE = `A {{MOOD}} lifestyle vision board / mood board poster. \
{{BACKGROUND}} background. \
A Pinterest-style grid layout of {{SCENE_COUNT}} distinct lifestyle photographs with {{BORDERS}}. \
The photos show: {{SCENES}}. \
{{DREAM_DETAILS}}\
Each photo occupies its own clean rectangular section. \
Ultra-high quality magazine editorial photography, aspirational and uplifting, warm atmosphere. \
Professional graphic design composition. Portrait format. \
No text, no words, no letters, no watermarks.`;

export const IMAGE_TO_IMAGE_TEMPLATE = `The person from the reference photo living their dream life. \
A {{MOOD}} lifestyle vision board / mood board. \
Multiple scenes showing them in {{AREAS_TEXT}} life moments: {{SCENES}}. \
{{DREAM_DETAILS}}\
Magazine editorial quality, aspirational lifestyle photography. \
The same person appears naturally in each scene, happy and fulfilled, living their best life. \
Portrait format. No text, no words, no letters, no watermarks.`;

// ── Style data ────────────────────────────────────────────────────────────────

export const STYLE_DATA: Record<AestheticStyle, { mood: string; background: string; borders: string }> = {
  minimal: {
    mood: 'clean minimalist Scandinavian',
    background: 'pure white',
    borders: 'thin crisp white borders',
  },
  vibrant: {
    mood: 'bold vibrant saturated',
    background: 'warm cream',
    borders: 'colorful thin borders',
  },
  ethereal: {
    mood: 'dreamy romantic pastel',
    background: 'soft blush and ivory',
    borders: 'delicate soft borders with subtle floral accents',
  },
  luxe: {
    mood: 'opulent luxury editorial',
    background: 'warm ivory with gold accents',
    borders: 'elegant thin gold-tinted borders',
  },
};

// ── Area scenes ───────────────────────────────────────────────────────────────

export const AREA_SCENES: Record<string, string[]> = {
  career: [
    'a beautiful home office with a MacBook and fresh flowers on the desk',
    'an entrepreneur celebrating a business win with champagne and laptop',
    'a modern glass-walled conference room with city views',
    'a person confidently presenting on a big stage to an audience',
  ],
  love: [
    'a happy couple laughing together at golden hour on the beach',
    'a romantic candlelit dinner for two with roses on the table',
    'a cozy Sunday morning in bed with coffee and soft sunlight streaming in',
    'a couple holding hands exploring a beautiful European city street',
  ],
  health: [
    'morning yoga on a sun-drenched rooftop terrace overlooking the city',
    'a colorful healthy meal spread with fresh fruits and smoothie bowls',
    'a person running joyfully along a scenic coastal path at sunrise',
    'a serene meditation space with plants, candles, and soft natural light',
  ],
  travel: [
    'a stunning infinity pool overlooking turquoise tropical ocean',
    'walking through vibrant colorful European streets with gelato',
    'a luxury beachfront villa with palm trees at golden sunset',
    'a breathtaking mountain vista with a hiking trail at sunrise',
  ],
  wealth: [
    'a luxurious modern home interior with floor-to-ceiling windows and ocean view',
    'a beautifully curated walk-in wardrobe with designer clothes and soft lighting',
    'a gleaming luxury convertible driving along a winding coastal road',
    'a rooftop fine dining table setting overlooking a glowing city skyline at night',
  ],
  creativity: [
    'a sun-drenched art studio with colorful canvases and an easel',
    'a person playing grand piano in a beautifully styled living room',
    'a beautifully organized creative desk with sketches and design tools',
    'a fashion moodboard with fabric swatches and sketches pinned to a studio wall',
  ],
};

// ── Build ─────────────────────────────────────────────────────────────────────

export type BuiltPrompt = {
  mode: GenerationMode;
  template: string;
  variables: Record<string, string>;
  hydrated: string;
};

function extractDreamPhrases(dreams: string, maxPhrases = 4): string {
  const phrases = dreams
    .split(/[.!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 120)
    .slice(0, maxPhrases);
  return phrases.length ? phrases.join('; ') + '. ' : '';
}

function hydrate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

export function buildPrompt(
  areas: string[],
  style: AestheticStyle,
  dreams: string,
  hasReferenceImage: boolean,
  customPrompt?: string,
): BuiltPrompt {
  const mode: GenerationMode = hasReferenceImage ? 'image-to-image' : 'text-to-image';

  // Custom prompt bypasses the template system
  if (customPrompt?.trim()) {
    return {
      mode,
      template: '{{CUSTOM_PROMPT}}',
      variables: { CUSTOM_PROMPT: customPrompt.trim() },
      hydrated: customPrompt.trim(),
    };
  }

  const { mood, background, borders } = STYLE_DATA[style];
  const scenes = areas.flatMap((a) => (AREA_SCENES[a] ?? []).slice(0, 2)).slice(0, 6);
  const dreamDetails = extractDreamPhrases(dreams);
  const areasText = areas.join(', ');

  if (mode === 'image-to-image') {
    const variables: Record<string, string> = {
      MOOD: mood,
      AREAS_TEXT: areasText,
      SCENES: scenes.map((s, i) => `scene ${i + 1}: ${s}`).join('; '),
      DREAM_DETAILS: dreamDetails,
    };
    return { mode, template: IMAGE_TO_IMAGE_TEMPLATE, variables, hydrated: hydrate(IMAGE_TO_IMAGE_TEMPLATE, variables) };
  }

  const variables: Record<string, string> = {
    MOOD: mood,
    BACKGROUND: background,
    SCENE_COUNT: String(scenes.length),
    BORDERS: borders,
    SCENES: scenes.map((s, i) => `photo ${i + 1}: ${s}`).join('; '),
    DREAM_DETAILS: dreamDetails,
  };
  return { mode, template: TEXT_TO_IMAGE_TEMPLATE, variables, hydrated: hydrate(TEXT_TO_IMAGE_TEMPLATE, variables) };
}

// ── Base64 helpers ────────────────────────────────────────────────────────────

export function base64ToBlob(dataUri: string): Blob {
  const [header, base64Data] = dataUri.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
