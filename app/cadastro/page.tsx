'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import AuthVisual from '@/components/auth/AuthVisual'

export default function CadastroPage() {
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false); const [accepted, setAccepted] = useState(false); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false)
  async function signup(event: FormEvent) {
    event.preventDefault(); if (!accepted) return setMessage('Aceite os termos para continuar.'); setLoading(true); setMessage('')
    try {
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback?next=/onboarding`
      const { error } = await createSupabaseBrowserClient().auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectTo, data: { display_name: name.trim() } } })
      setMessage(error ? error.message : 'Conta criada! Confira seu e-mail para confirmar o acesso.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar sua conta.') }
    finally { setLoading(false) }
  }
  return <main className="auth-page"><AuthVisual/><section className="auth-panel">
    <Link href="/" className="brand-mark auth-mobile-brand"><span>A</span><strong>Aprumo</strong></Link>
    <div className="auth-form-wrap signup-wrap"><p className="section-label">COMECE SUA JORNADA</p><h1>Construa sua<br/><em>melhor versão.</em></h1><p className="auth-subtitle">Leva menos de um minuto. A mudança vem depois.</p>
      <form onSubmit={signup} className="auth-form">
        <label>Como podemos te chamar?<div className="auth-field"><UserRound size={18}/><input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"/></div></label>
        <label>E-mail<div className="auth-field"><Mail size={18}/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></div></label>
        <label>Crie uma senha<div className="auth-field"><LockKeyhole size={18}/><input required minLength={6} type={showPassword?'text':'password'} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/><button type="button" aria-label={showPassword?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <button type="button" className="terms-check" onClick={()=>setAccepted(!accepted)}><span className={accepted?'checked':''}>{accepted&&<Check size={12}/>}</span><small>Eu concordo com os <u>Termos de Uso</u> e a <u>Política de Privacidade</u>.</small></button>
        <button className="auth-submit" disabled={loading}>{loading?'Criando conta...':'Criar minha conta'}<ArrowRight size={18}/></button>
        {message&&<p className="auth-message-text" role="alert">{message}</p>}
      </form><p className="auth-switch">Já tem uma conta? <Link href="/login">Entrar</Link></p>
    </div>
  </section></main>
}
