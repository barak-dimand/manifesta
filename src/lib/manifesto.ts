import { getExplorerItems } from '@/lib/wizard/explorationPrompts';

const AREA_LABELS: Record<string, string> = {
  career: 'Career & Purpose',
  love: 'Love & Relationships',
  health: 'Health & Vitality',
  travel: 'Travel & Adventure',
  wealth: 'Wealth & Abundance',
  creativity: 'Creativity & Joy',
};

interface ManifestoData {
  dreams: string;
  selectedAreas: string[];
  style: string;
  goals?: Array<{ area: string; objective: string; habit: string }>;
  selectedQuotes?: string[] | null;
  customQuotes?: string[] | null;
  explorerData?: unknown;
  photoUrls?: string[] | null;
}

type ExplorerData = {
  promptStates?: Array<{ selectedIndices: number[]; edits: Record<number, string>; customText: string }>;
  priorities?: Record<string, { want: number; believe: number }>;
};

export function buildManifestoDocument(data: ManifestoData): string {
  const parts: string[] = [];

  parts.push('MY DREAM LIFE MANIFESTO');
  parts.push('');

  if (data.dreams?.trim()) {
    parts.push('-- My Dream Life --');
    parts.push(data.dreams.trim());
    parts.push('');
  }

  const explorerData = data.explorerData as ExplorerData | null;
  const items = getExplorerItems(explorerData?.promptStates);
  if (items.length > 0) {
    parts.push('-- My Prioritized Dreams (sorted by desire + belief) --');
    items.forEach((item, i) => {
      const p = explorerData?.priorities?.[item.text];
      const suffix = p ? ` [want ${p.want}/10 · believe ${p.believe}/10]` : '';
      parts.push(`${i + 1}. ${item.text}${suffix}`);
    });
    parts.push('');
  }

  if (data.selectedAreas?.length > 0) {
    parts.push("-- Life Areas I'm Focusing On --");
    data.selectedAreas.forEach((a) => parts.push(`* ${AREA_LABELS[a] ?? a}`));
    parts.push('');
  }

  const quotes = [...(data.selectedQuotes ?? []), ...(data.customQuotes ?? [])];
  if (quotes.length > 0) {
    parts.push('-- Quotes & Affirmations --');
    quotes.forEach((q) => parts.push(`"${q}"`));
    parts.push('');
  }

  const activeGoals = (data.goals ?? []).filter((g) => g.objective?.trim());
  if (activeGoals.length > 0) {
    parts.push('-- My Goals & Habits --');
    activeGoals.forEach((g) => {
      parts.push(`* ${g.objective}`);
      if (g.habit?.trim()) parts.push(`  Daily habit: ${g.habit}`);
    });
    parts.push('');
  }

  if (data.style) {
    parts.push('-- Visual Aesthetic --');
    parts.push(data.style);
    parts.push('');
  }

  if (data.photoUrls?.length) {
    parts.push('-- Note --');
    parts.push(
      'Uploaded image files are included separately and help personalize your visual board.',
    );
  }

  return parts.join('\n').trim();
}
