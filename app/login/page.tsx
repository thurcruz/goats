'use client'
import { useState } from 'react'
import { ArrowRight, Mail, Sparkles } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  async function login() {
    if (!email.trim()) return
    setLoading(true); setMessage('')
    try {
      const supabase = createSupabaseBrowserClient()
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } })
      setMessage(error ? error.message : 'Enviamos um link seguro para o seu e-mail.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível entrar.') }
    finally { setLoading(false) }
  }
  return <main className="grid min-h-svh place-items-center p-5"><section className="surface w-full max-w-md p-7 md:p-9"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d0e027] text-black"><Sparkles size={21}/></span><p className="eyebrow mt-8">Sua evolução continua</p><h1 className="display mt-3 text-4xl font-semibold">Entre no GOATS.</h1><p className="muted mt-3 text-sm">Enviaremos um link de acesso. Sem senha para esquecer.</p><label className="muted mt-7 block text-xs font-semibold uppercase tracking-wider">Seu e-mail</label><div className="field mt-2 flex items-center gap-3"><Mail size={17} className="muted"/><input className="min-w-0 flex-1 bg-transparent outline-none" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="voce@exemplo.com"/></div><button onClick={login} disabled={loading} className="energy-button mt-4 flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50">{loading?'Enviando...':'Continuar'}<ArrowRight size={17}/></button>{message&&<p className="muted mt-4 text-center text-sm">{message}</p>}</section></main>
}
