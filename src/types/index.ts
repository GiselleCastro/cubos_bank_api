import { z } from 'zod'
import { paginationSchema } from '../schema'

export type Pagination = z.infer<typeof paginationSchema>
