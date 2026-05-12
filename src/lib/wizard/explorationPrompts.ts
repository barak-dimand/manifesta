export const EXPLORATION_PROMPTS = [
  {
    question: "If money and time were no object, where would you wake up every morning?",
    placeholder: "e.g., A sun-drenched villa overlooking the Mediterranean…",
    category: "environment",
    suggestions: [
      "A modern penthouse in New York City with floor-to-ceiling views",
      "A peaceful beachfront villa in Bali with the sound of waves",
      "A cozy mountain cabin surrounded by nature in the Swiss Alps",
      "A sun-drenched home in Tuscany with vineyards and olive groves",
      "A sleek apartment in Tokyo with city lights all around me",
      "A charming cottage in the English countryside with a garden",
      "A luxurious estate in Malibu overlooking the Pacific Ocean",
      "A tropical overwater bungalow in the Maldives",
    ],
  },
  {
    question: "What would a perfect workday look like for you?",
    placeholder: "e.g., Running my own creative studio, collaborating with inspiring people…",
    category: "career",
    suggestions: [
      "Running my own business from anywhere in the world",
      "Leading a creative agency with a passionate, talented team",
      "Coaching and mentoring others to unlock their potential",
      "Building an app or tech product that changes millions of lives",
      "Writing books and sharing my ideas on global stages",
      "Designing beautiful spaces as an interior architect",
      "Creating content full-time: videos, podcasts, and writing",
      "Working in fashion or beauty, launching my own brand",
    ],
  },
  {
    question: "Who is around you, and how do those relationships feel?",
    placeholder: "e.g., A loving partner, close friends who inspire me, a supportive community…",
    category: "relationships",
    suggestions: [
      "A deeply loving and supportive life partner who truly gets me",
      "A tight circle of ambitious, uplifting friends who celebrate each other",
      "A warm, close-knit family that gathers often and shares joy",
      "A thriving community of like-minded creators and entrepreneurs",
      "A mentor who guides me and believes in my vision",
      "Beautiful friendships across the globe with people I adore",
      "A happy, healthy family with kids who are curious and kind",
      "Collaborators and co-founders who share my passion and energy",
    ],
  },
  {
    question: "How does your body feel? What does your health look like?",
    placeholder: "e.g., Strong, energized, glowing. I move my body joyfully every day…",
    category: "health",
    suggestions: [
      "Strong, toned, and full of energy. I feel amazing every morning",
      "Calm, balanced, and deeply at peace with daily meditation practice",
      "Flexible and powerful from a consistent yoga and movement routine",
      "Glowing skin, bright eyes, and vibrant health from nourishing food",
      "Running marathons, hiking mountains. My body is capable of anything",
      "Sleeping deeply, waking refreshed, with a clear and focused mind",
      "Dancing, swimming, surfing. I move my body with pure joy",
      "Mentally sharp, emotionally resilient, and spiritually grounded",
    ],
  },
  {
    question: "What experiences make your soul come alive?",
    placeholder: "e.g., Traveling to new countries, creating art, learning new skills…",
    category: "experiences",
    suggestions: [
      "Exploring a new country every month and immersing in local culture",
      "Creating art: painting, sculpting, or making music that moves people",
      "Attending incredible events: fashion weeks, film festivals, galleries",
      "Learning new languages and connecting with people everywhere",
      "Cooking gourmet meals and hosting beautiful dinner parties",
      "Skydiving, scuba diving, surfing. Chasing adventure and adrenaline",
      "Volunteering and giving back to communities that need it most",
      "Reading, journaling, and growing into the wisest version of myself",
    ],
  },
] as const;

export type ExplorationPrompt = typeof EXPLORATION_PROMPTS[number];

export type SerializedExplorerItem = { text: string };

export function getExplorerItems(
  promptStates: Array<{ selectedIndices: number[]; edits: Record<number, string>; customText: string }> | null | undefined,
): SerializedExplorerItem[] {
  if (!promptStates) return [];
  const items: SerializedExplorerItem[] = [];
  for (let i = 0; i < EXPLORATION_PROMPTS.length; i++) {
    const ps = promptStates[i];
    if (!ps) continue;
    const prompt = EXPLORATION_PROMPTS[i];
    for (const idx of [...ps.selectedIndices].sort((a, b) => a - b)) {
      items.push({ text: ps.edits[idx] ?? prompt.suggestions[idx] });
    }
    const custom = ps.customText?.trim();
    if (custom) items.push({ text: custom });
  }
  return items;
}
