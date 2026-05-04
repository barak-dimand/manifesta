import { getDb } from '@/lib/db';
import { appLogs } from '@/lib/db/schema';

export type LogLevel = 'error' | 'warn' | 'info';

interface LogContext {
  route?: string;
  userId?: string;
  details?: unknown;
}

async function write(level: LogLevel, message: string, ctx?: LogContext) {
  // Always mirror to console so local dev / Vercel logs still work
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(`[${level.toUpperCase()}]${ctx?.route ? ` ${ctx.route}` : ''} ${message}`, ctx?.details ?? '');

  try {
    await getDb().insert(appLogs).values({
      level,
      route: ctx?.route ?? null,
      message,
      details: ctx?.details !== undefined ? (ctx.details as Record<string, unknown>) : null,
      userId: ctx?.userId ?? null,
    });
  } catch {
    // Never let logging errors surface to callers
  }
}

export const logger = {
  error: (message: string, ctx?: LogContext) => write('error', message, ctx),
  warn:  (message: string, ctx?: LogContext) => write('warn',  message, ctx),
  info:  (message: string, ctx?: LogContext) => write('info',  message, ctx),
};

/** Serialise an unknown caught value into a loggable object. */
export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack, name: err.name };
  }
  return { raw: String(err) };
}
