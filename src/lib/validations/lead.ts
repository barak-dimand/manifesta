import { z } from 'zod';
import { LifeArea, AestheticStyle, GoalSchema } from './wizard';

// Shape of wizard data persisted alongside the lead email
export const WizardLeadPayloadSchema = z.object({
  selectedAreas: z.array(LifeArea).optional(),
  dreams: z.string().optional(),
  style: AestheticStyle.optional(),
  goals: z.array(GoalSchema).optional(),
  manifesto: z.string().optional(),
  enableTimeline: z.boolean().optional(),
  photoCount: z.number().int().nonnegative().optional(),
  photoUrls: z.array(z.string()).optional(),
});

export type WizardLeadPayload = z.infer<typeof WizardLeadPayloadSchema>;
