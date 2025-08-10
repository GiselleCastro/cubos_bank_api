import { z } from 'zod'
import { CardType } from '@prisma/client'

export const createAccountBodySchema = z.object({
  branch: z.string().length(3),
  account: z.string().regex(/^\d{7}-\d{1}$/, 'Enter the account in XXXXXXX-X format.'),
})

export const createCardBodySchema = z.object({
  type: z.enum(CardType),
  number: z
    .string()
    .transform((number) => number.replace(/\s/g, ''))
    .refine((number) => /^\d+$/.test(number), {
      message: 'The card number must contain only digits',
    })
    .refine((number) => number.length === 16, {
      message: 'The card number must be 16 digits long',
    }),
  cvv: z
    .string()
    .refine((number) => /^\d+$/.test(number), {
      message: 'The cvv must contain only digits',
    })
    .length(3),
})

export const idAccountParamsSchema = z.object({
  accountId: z.uuid(),
})
