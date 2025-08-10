import { z } from 'zod'
import dotenv from 'dotenv'
import { logger } from './logger'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  API_COMPILANCE_CUBOS_BASE_URL: z.url(),
  API_COMPILANCE_CUBOS_TIMEOUT: z.coerce.number(),
  API_COMPILANCE_CUBOS_CLIENT: z.email(),
  API_COMPILANCE_CUBOS_SECRET: z.string().min(1),
  DATABASE_URL: z.url(),
  SERVER_PORT: z.coerce.number(),
  SERVER_HOST: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_SECRET_EXPIRES_IN_SECONDS: z.coerce.number(),
  TRANSACTION_COMPILANCE_API_POLLING_MAX_RETRY: z.coerce.number(),
  TRANSACTION_COMPILANCE_API_POLLING_DELAY_MS: z.coerce.number(),
  CARD_SECRET_KEY: z.string().min(1),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  logger.error('Some environment variable is incorrect.')
  process.exit(1)
}

export const env = parsedEnv.data
