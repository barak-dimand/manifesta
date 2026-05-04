import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  wizardData: jsonb('wizard_data'),
  source: text('source').default('wizard'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const boards = pgTable('boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  email: text('email').notNull(),
  selectedAreas: text('selected_areas').array().notNull(),
  dreams: text('dreams').notNull(),
  style: text('style').notNull(),
  goals: jsonb('goals').notNull(),
  manifesto: text('manifesto'),
  wallpaperUrl: text('wallpaper_url'),
  wallpaperType: text('wallpaper_type'),
  enableTimeline: boolean('enable_timeline').default(false),
  photoUrls: text('photo_urls').array(),
  explorerData: jsonb('explorer_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const emailSubscriptions = pgTable('email_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  boardId: uuid('board_id').references(() => boards.id),
  isActive: boolean('is_active').default(true),
  sendHour: integer('send_hour').default(8),
  timezone: text('timezone').default('UTC'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const generationTests = pgTable('generation_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  areas: text('areas').array().notNull(),
  style: text('style').notNull(),
  dreams: text('dreams').notNull(),
  prompt: text('prompt').notNull(),
  imageUrl: text('image_url'),
  notes: text('notes'),
  rating: integer('rating'), // 1-5
  model: text('model'),     // e.g. 'black-forest-labs/flux-dev'
  provider: text('provider'), // 'replicate' | 'openai' | 'google'
  createdAt: timestamp('created_at').defaultNow(),
});

// Every wallpaper a user generates — multiple per board session, up to 3/day.
export const generatedWallpapers = pgTable('generated_wallpapers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  boardId: uuid('board_id'),
  imageUrl: text('image_url').notNull(),
  manifesto: text('manifesto'),
  dreams: text('dreams'),
  style: text('style'),
  areas: text('areas').array(),
  mode: text('mode'), // 'text-to-image' | 'image-to-image'
  createdAt: timestamp('created_at').defaultNow(),
});

export type GeneratedWallpaper = typeof generatedWallpapers.$inferSelect;

// Structured application logs written by the logger utility.
export const appLogs = pgTable('app_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  level: text('level').notNull(),    // 'error' | 'warn' | 'info'
  route: text('route'),              // e.g. '/api/wallpaper/generate'
  message: text('message').notNull(),
  details: jsonb('details'),         // error stack, request context, user data, etc.
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type AppLog = typeof appLogs.$inferSelect;

// Stores the preferred image model per generation mode + style combination.
// configKey format: 'text-to-image', 'image-to-image', 'text-to-image:minimal', etc.
export const modelConfig = pgTable('model_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  configKey: text('config_key').unique().notNull(),
  provider: text('provider').notNull(),
  modelId: text('model_id').notNull(),
  params: jsonb('params'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Generic key-value text config — used for storing editable server-side values like system prompts.
export const promptConfig = pgTable('prompt_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  configKey: text('config_key').unique().notNull(),
  value: text('value').notNull(),
  label: text('label'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type PromptConfig = typeof promptConfig.$inferSelect;

export type GenerationTest = typeof generationTests.$inferSelect;
export type NewGenerationTest = typeof generationTests.$inferInsert;

export type ModelConfig = typeof modelConfig.$inferSelect;
export type NewModelConfig = typeof modelConfig.$inferInsert;

// Type helpers for Drizzle inference
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type NewEmailSubscription = typeof emailSubscriptions.$inferInsert;
