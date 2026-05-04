export type Provider = 'replicate' | 'openai' | 'google';
export type ModelCapability = 'text-to-image' | 'image-to-image' | 'both';

export interface ImageModel {
  id: string;
  provider: Provider;
  label: string;
  description: string;
  capability: ModelCapability;
  estimatedTime: string;
  notes?: string;
}

export const IMAGE_MODELS: ImageModel[] = [
  // ── Replicate ──────────────────────────────────────────────────────────────
  {
    id: 'black-forest-labs/flux-dev',
    provider: 'replicate',
    label: 'Flux Dev',
    description: 'Best prompt adherence for collage layouts. 28-step quality.',
    capability: 'text-to-image',
    estimatedTime: '~30s',
    notes: 'Default text-to-image',
  },
  {
    id: 'black-forest-labs/flux-schnell',
    provider: 'replicate',
    label: 'Flux Schnell',
    description: '4-step fast generation. Good for quick iteration tests.',
    capability: 'text-to-image',
    estimatedTime: '~5s',
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    provider: 'replicate',
    label: 'Flux 1.1 Pro',
    description: 'Faster than Flux Dev with comparable or better quality.',
    capability: 'text-to-image',
    estimatedTime: '~20s',
  },
  {
    id: 'black-forest-labs/flux-1.1-pro-ultra',
    provider: 'replicate',
    label: 'Flux 1.1 Pro Ultra',
    description: 'Highest quality Flux. Supports person reference via image_prompt.',
    capability: 'both',
    estimatedTime: '~40s',
    notes: 'Default image-to-image',
  },
  {
    id: 'ideogram-ai/ideogram-v2',
    provider: 'replicate',
    label: 'Ideogram V2',
    description: 'Great for structured layouts, grids, and text-heavy designs.',
    capability: 'text-to-image',
    estimatedTime: '~25s',
  },
  {
    id: 'recraft-ai/recraft-v3',
    provider: 'replicate',
    label: 'Recraft V3',
    description: 'Design / illustration style. Clean, precise compositions.',
    capability: 'text-to-image',
    estimatedTime: '~20s',
  },
  // ── OpenAI ─────────────────────────────────────────────────────────────────
  {
    id: 'dall-e-3',
    provider: 'openai',
    label: 'DALL-E 3',
    description: 'Reliable, high-quality results. Strong instruction following.',
    capability: 'text-to-image',
    estimatedTime: '~15s',
    notes: 'Requires OPENAI_API_KEY',
  },
  {
    id: 'gpt-image-1',
    provider: 'openai',
    label: 'GPT Image 1',
    description: "OpenAI's newest and best image model. Supports reference images for person placement.",
    capability: 'both',
    estimatedTime: '~20s',
    notes: 'Requires OPENAI_API_KEY',
  },
  // ── Google ─────────────────────────────────────────────────────────────────
  {
    id: 'imagen-3.0-generate-002',
    provider: 'google',
    label: 'Imagen 3',
    description: "Google's highest-quality image generation model.",
    capability: 'text-to-image',
    estimatedTime: '~15s',
    notes: 'Requires GOOGLE_AI_API_KEY',
  },
  {
    id: 'imagen-3.0-fast-generate-001',
    provider: 'google',
    label: 'Imagen 3 Fast',
    description: 'Faster variant of Imagen 3 with slightly lower quality.',
    capability: 'text-to-image',
    estimatedTime: '~8s',
    notes: 'Requires GOOGLE_AI_API_KEY',
  },
];

export const DEFAULT_T2I_MODEL = 'black-forest-labs/flux-dev';
export const DEFAULT_I2I_MODEL = 'black-forest-labs/flux-1.1-pro-ultra';

export function getModel(id: string): ImageModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === id);
}

export function modelsByProvider(provider: Provider): ImageModel[] {
  return IMAGE_MODELS.filter((m) => m.provider === provider);
}

export const PROVIDERS: { id: Provider; label: string; envKey: string }[] = [
  { id: 'replicate', label: 'Replicate', envKey: 'REPLICATE_API_TOKEN' },
  { id: 'openai', label: 'OpenAI', envKey: 'OPENAI_API_KEY' },
  { id: 'google', label: 'Google AI', envKey: 'GOOGLE_AI_API_KEY' },
];
