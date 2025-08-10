import { env } from '../config/env'
import { RequestTimeoutError } from '../err/appError'
import { TransactionStatus } from '@prisma/client'

const wait = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

interface GetTransactionById {
  (empontentId: string): Promise<{ data: { status: TransactionStatus } }>
}

export async function pollingTransactionStatus(
  empontentId: string,
  getTransactionById: GetTransactionById,
  maxRetry: number = env.TRANSACTION_COMPILANCE_API_POLLING_MAX_RETRY,
  delayMilisecons: number = env.TRANSACTION_COMPILANCE_API_POLLING_DELAY_MS,
): Promise<TransactionStatus> {
  let retry = 0

  while (retry <= maxRetry) {
    try {
      const { data } = await getTransactionById(empontentId)
      const { status } = data

      if (status === TransactionStatus.authorized) {
        return status
      }

      if (status === TransactionStatus.unauthorized) {
        return status
      }

      if (retry === maxRetry && status === TransactionStatus.processing) {
        return status
      }
    } catch (error) {
      if (retry >= maxRetry) {
        throw error
      }
    }

    await wait(delayMilisecons)
    retry++
  }

  throw new RequestTimeoutError('Polling exceeded max retries without definitive status.')
}
