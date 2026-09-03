import { NextResponse } from 'next/server'
import { creditsForCaktoProduct, safeEqualSecret, type CaktoWebhookPayload } from '@/lib/cakto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET
  if (!expectedSecret) return NextResponse.json({ error: 'Webhook não configurado' }, { status: 503 })

  let payload: CaktoWebhookPayload
  try {
    payload = await request.json() as CaktoWebhookPayload
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!safeEqualSecret(payload.secret, expectedSecret)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const event = text(payload.event)
  const orderId = text(payload.data?.id)
  const email = text(payload.data?.customer?.email).toLowerCase()
  const productId = text(payload.data?.product?.id)
  const credits = creditsForCaktoProduct(productId)

  if (!['purchase_approved', 'refund', 'chargeback'].includes(event)) {
    return NextResponse.json({ received: true, ignored: true })
  }
  if (!orderId || !email || !productId || !credits) {
    return NextResponse.json({ error: 'Pedido, cliente ou produto inválido' }, { status: 422 })
  }

  const supabase = createSupabaseAdminClient()
  const storedPayload = { event: payload.event, data: payload.data }
  const { data, error } = await supabase.rpc('process_cakto_payment', {
    p_event_key: `${event}:${orderId}`,
    p_event_type: event,
    p_order_id: orderId,
    p_customer_email: email,
    p_product_id: productId,
    p_product_name: text(payload.data?.product?.name),
    p_offer_id: text(payload.data?.offer?.id) || null,
    p_amount: Number(payload.data?.amount) || 0,
    p_credits: credits,
    p_payload: storedPayload,
  })

  if (error) {
    console.error('Cakto webhook:', error.message)
    return NextResponse.json({ error: 'Falha ao processar pagamento' }, { status: 500 })
  }

  return NextResponse.json({ received: true, result: data })
}
