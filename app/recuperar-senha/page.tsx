'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import AuthVisual from '@/components/auth/AuthVisual'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('')
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/auth/callback?next=/nova-senha` })
      setMessage(error ? error.message : 'Se existir uma conta com este e-mail, você receberá as instruções em instantes.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.') }
    finally { setLoading(false) }
  }
  return <main className="auth-page"><AuthVisual/><section className="auth-panel"><Link href="/" className="brand-mark auth-mobile-brand"><span>G</span><strong>APRUMO</strong></Link><div className="auth-form-wrap"><Link href="/login" className="auth-back"><ArrowLeft size={15}/> Voltar para o login</Link><p className="section-label mt-8">RECUPERAR ACESSO</p><h1>Volte para sua<br/><em>jornada.</em></h1><p className="auth-subtitle">Informe seu e-mail e enviaremos um link seguro.</p><form onSubmit={submit} className="auth-form"><label>E-mail<div className="auth-field"><Mail size={18}/><input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="voce@exemplo.com"/></div></label><button className="auth-submit" disabled={loading}>{loading?'Enviando...':'Enviar link seguro'}<ArrowRight size={18}/></button>{message&&<p className="auth-message-text" role="status">{message}</p>}</form></div></section></main>
}
