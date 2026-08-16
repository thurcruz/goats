import { NextResponse } from 'next/server'
import type { GoatStore } from '@/lib/types'
import type { Json } from '@/lib/database.types'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function context() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return { supabase, user }
}

export async function GET() {
  try {
    const ctx = await context()
    if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const { data, error } = await ctx.supabase.from('user_state').select('payload, version, updated_at').eq('user_id', ctx.user.id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ store: data?.payload ?? null, version: data?.version ?? 0, updatedAt: data?.updated_at ?? null })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Backend indisponível' }, { status: 503 })
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await context()
    if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const body = await request.json() as { store?: GoatStore }
    if (!body.store || typeof body.store !== 'object') return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    const payload = body.store as unknown as Json
    const { data, error } = await ctx.supabase.from('user_state').upsert({ user_id: ctx.user.id, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select('version, updated_at').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, version: data.version, updatedAt: data.updated_at })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Backend indisponível' }, { status: 503 })
  }
}
