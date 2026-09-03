import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { data, error } = await supabase.rpc('get_my_credit_account')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      balance: data?.[0]?.balance ?? 0,
      checkoutUrl: process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_URL ?? null,
      checkoutEmail: user.email ?? null,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Saldo indisponível' }, { status: 503 })
  }
}
