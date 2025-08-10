import { z } from 'zod'

export const loginBodySchema = z.object({
  document: z
    .string()
    .transform((number) => number.replace(/[.\-\\/\s]/g, ''))
    .refine((number) => /^\d+$/.test(number), {
      message: 'The document must contain only digits',
    })
    .refine((number) => number.length === 11 || number.length === 14, {
      message: 'The document must be a CPF or CNPJ.',
    }),
  password: z.string(),
})

export const createUserBodySchema = loginBodySchema.extend({
  name: z.string(),
})
