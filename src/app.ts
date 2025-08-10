import express from 'express'
import { router as userRoutes } from './routes/public.routes'
import { router as accountRoutes } from './routes/accounts.routes'
import { router as cardRoutes } from './routes/cards.routes'
import { ErrorHandler } from './middlewares/errorHandler'

export const app = express()

app.use(express.json())
app.use('/', userRoutes)
app.use('/accounts', accountRoutes)
app.use('/cards', cardRoutes)
app.use(ErrorHandler.handle())

export const buildServer = async () => {
  return app
}
