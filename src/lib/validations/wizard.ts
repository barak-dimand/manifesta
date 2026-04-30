import { z } from 'zod';

export const LifeArea = z.enum(['career', 'love', 'health', 'travel', 'wealth', 'creativity']);
export type LifeArea = z.infer<typeof LifeArea>;

export const AestheticStyle = z.enum(['minimal', 'vibrant', 'ethereal', 'luxe']);
export type AestheticStyle = z.infer<typeof AestheticStyle>;

export const Timeline = z.enum(['30days', '3months', '6months', '1year']);
export type Timeline = z.infer<typeof Timeline>;

export const GoalSchema = z.object({
  area: LifeArea,
  objective: z.string().min(1).max(200),
  habit: z.string().min(1).max(200),
  timeline: Timeline.optional(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const Step1Schema = z.object({
  selectedAreas: z.array(LifeArea).min(1, 'Select at least one life area'),
  dreams: z.string().min(10, 'Tell us more about your dream life').max(1500),
});

export const Step2Schema = z.object({
  photos: z.array(z.string()).max(5),
  style: AestheticStyle,
});

export const Step3Schema = z.object({
  goals: z.array(GoalSchema).min(0),
  enableTimeline: z.boolean(),
});

export const Step4Schema = z.object({
  manifesto: z.string(),
  wallpaperType: z.enum(['ai', 'collage']),
  emailOptIn: z.boolean(),
});

export const WizardSchema = Step1Schema
  .merge(Step2Schema)
  .merge(Step3Schema)
  .merge(Step4Schema);

export type WizardData = z.infer<typeof WizardSchema>;
export type Step1Data = z.infer<typeof Step1Schema>;
export type Step2Data = z.infer<typeof Step2Schema>;
export type Step3Data = z.infer<typeof Step3Schema>;
export type Step4Data = z.infer<typeof Step4Schema>;

export const LeadSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export type LeadData = z.infer<typeof LeadSchema>;
