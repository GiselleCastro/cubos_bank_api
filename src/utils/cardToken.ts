import crypto from 'crypto'
import { env } from '../config/env'
import { BadRequestError } from '../err/appError'

const CARD_SECRET_KEY = crypto.createHash('sha256').update(env.CARD_SECRET_KEY).digest()

const encryptAesGcm = (plaintext: string): Uint8Array<ArrayBufferLike> => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', CARD_SECRET_KEY, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // @ts-expect-error Uint8Array<ArrayBufferLike>
  return Buffer.concat([iv, tag, ciphertext]).toString('base64')
}

const decryptAesGcm = (blobBase64: Uint8Array<ArrayBufferLike>) => {
  // @ts-expect-error Uint8Array<ArrayBufferLike>
  const data = Buffer.from(blobBase64, 'base64')
  const iv = data.slice(0, 12)
  const tag = data.slice(12, 28)
  const ciphertext = data.slice(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', CARD_SECRET_KEY, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}

const maskCardNumber = (cardNumber: string): string => {
  return cardNumber
    .replace(/\D/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

export const cardTokenizer = (cardNumber: string, cvv: string) => {
  const cardInfo = `${cardNumber}|${cvv}`
  const blob = encryptAesGcm(cardInfo)
  const token = crypto.createHash('sha256').update(cardNumber).digest('hex')
  return { token, blob }
}

export const reverterTokenCard = (
  blob: Uint8Array<ArrayBufferLike>,
): { cardNumber: string; cvv: string } => {
  try {
    const dados = decryptAesGcm(blob)
    const [cardNumber, cvv] = dados.split('|')
    return { cardNumber: maskCardNumber(cardNumber!), cvv: cvv! }
  } catch {
    throw new BadRequestError('Error verifying card authenticity.')
  }
}
