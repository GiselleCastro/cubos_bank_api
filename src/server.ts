import { app } from './app'
import { logger } from './config/logger'

const PORT = process.env.SERVER_PORT
const HOST = process.env.SERVER_HOST

app.listen(PORT, () => {
  logger.info(`Server running on ${PORT}, http://${HOST}:${PORT}`)
})
