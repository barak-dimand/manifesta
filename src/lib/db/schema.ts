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

// Type helpers for Drizzle inference
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type NewEmailSubscription = typeof emailSubscriptions.$inferInsert;
