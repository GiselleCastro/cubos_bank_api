import pino from 'pino'

export const logger = pino({
  base: { pid: false, hostname: false },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
    },
  },
})
