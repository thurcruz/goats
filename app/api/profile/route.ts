import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const permissionKeys = ['tasks', 'goals', 'books', 'moods', 'finance', 'antivicio'] as const

async function authenticatedContext() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return { supabase, user }
}

export async function GET() {
  try {
    const context = await authenticatedContext()
    if (!context) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const { data, error } = await context.supabase.from('profiles').select('display_name, purpose, ai_permissions, created_at').eq('id', context.user.id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data, email: context.user.email ?? null })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Perfil indisponível' }, { status: 503 }) }
}

export async function PUT(request: Request) {
  try {
    const context = await authenticatedContext()
    if (!context) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const body = await request.json() as { displayName?: unknown; purpose?: unknown; aiPermissions?: unknown }
    const update: { display_name?: string; purpose?: string; ai_permissions?: Record<string, boolean>; updated_at: string } = { updated_at: new Date().toISOString() }
    if (body.displayName !== undefined) {
      if (typeof body.displayName !== 'string' || body.displayName.trim().length < 2 || body.displayName.trim().length > 60) return NextResponse.json({ error: 'Nome inválido' }, { status: 400 })
      update.display_name = body.displayName.trim()
    }
    if (body.purpose !== undefined) {
      if (typeof body.purpose !== 'string' || body.purpose.length > 180) return NextResponse.json({ error: 'Propósito inválido' }, { status: 400 })
      update.purpose = body.purpose.trim()
    }
    if (body.aiPermissions !== undefined) {
      if (!body.aiPermissions || typeof body.aiPermissions !== 'object' || Array.isArray(body.aiPermissions)) return NextResponse.json({ error: 'Permissões inválidas' }, { status: 400 })
      const source = body.aiPermissions as Record<string, unknown>
      update.ai_permissions = Object.fromEntries(permissionKeys.map(key => [key, source[key] === true]))
    }
    const { data, error } = await context.supabase.from('profiles').update(update).eq('id', context.user.id).select('display_name, purpose, ai_permissions, updated_at').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível atualizar o perfil' }, { status: 503 }) }
}
