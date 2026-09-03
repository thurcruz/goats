import 'server-only'

export type CaktoWebhookPayload = {
  secret?: unknown
  event?: unknown
  data?: {
    id?: unknown
    refId?: unknown
    status?: unknown
    amount?: unknown
    paidAt?: unknown
    customer?: { email?: unknown }
    product?: { id?: unknown; name?: unknown }
    offer?: { id?: unknown; name?: unknown }
  }
}

export function creditsForCaktoProduct(productId: string) {
  const entries = (process.env.CAKTO_PRODUCT_CREDITS ?? '').split(',')
  for (const entry of entries) {
    const separator = entry.lastIndexOf(':')
    if (separator < 1) continue
    const id = entry.slice(0, separator).trim()
    const credits = Number(entry.slice(separator + 1).trim())
    if (id === productId && Number.isSafeInteger(credits) && credits > 0) return credits
  }
  return null
}

export function safeEqualSecret(received: unknown, expected: string) {
  if (typeof received !== 'string' || received.length !== expected.length) return false
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= received.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return mismatch === 0
}
