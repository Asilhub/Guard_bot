import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  OWNER_ID: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('./logs'),
  DEFAULT_WARN_LIMIT: z.string().transform(Number).default('3'),
  DEFAULT_MUTE_DURATION: z.string().transform(Number).default('60'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('5'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('10000'),
  NEW_USER_RESTRICT_DURATION: z.string().transform(Number).default('300'),
  WEBHOOK_URL: z.string().optional(),
  WEBHOOK_PORT: z.string().transform(Number).default('3000'),
  WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  bot: {
    token: parsed.data.BOT_TOKEN,
    ownerId: parsed.data.OWNER_ID,
  },
  db: {
    url: parsed.data.DATABASE_URL,
  },
  redis: {
    url: parsed.data.REDIS_URL,
    password: parsed.data.REDIS_PASSWORD,
  },
  app: {
    env: parsed.data.NODE_ENV,
    logLevel: parsed.data.LOG_LEVEL,
    logDir: parsed.data.LOG_DIR,
    isDev: parsed.data.NODE_ENV === 'development',
    isProd: parsed.data.NODE_ENV === 'production',
  },
  defaults: {
    warnLimit: parsed.data.DEFAULT_WARN_LIMIT,
    muteDuration: parsed.data.DEFAULT_MUTE_DURATION,
    rateLimitMax: parsed.data.RATE_LIMIT_MAX,
    rateLimitWindow: parsed.data.RATE_LIMIT_WINDOW,
    newUserRestrictDuration: parsed.data.NEW_USER_RESTRICT_DURATION,
  },
  webhook: {
    url: parsed.data.WEBHOOK_URL,
    port: parsed.data.WEBHOOK_PORT,
    secret: parsed.data.WEBHOOK_SECRET,
  },
} as const;
