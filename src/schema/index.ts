import { z } from 'zod'

export const paginationSchema = z.object({
  itemsPerPage: z.coerce.number().int().nonnegative().optional(),
  currentPage: z.coerce.number().int().positive().optional(),
})
