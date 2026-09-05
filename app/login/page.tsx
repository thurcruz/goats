'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import AuthVisual from '@/components/auth/AuthVisual'

export default function LoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false)
  async function login(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage('')
    try {
      const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email: email.trim(), password })
      if (error) setMessage(error.message); else {
        const requestedNext = new URLSearchParams(window.location.search).get('next')
        const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/dashboard'
        router.push(next); router.refresh()
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível entrar.') }
    finally { setLoading(false) }
  }
  return <main className="auth-page"><AuthVisual/><section className="auth-panel">
    <Link href="/" className="brand-mark auth-mobile-brand"><span>A</span><strong>Aprumo</strong></Link>
    <div className="auth-form-wrap"><p className="section-label">BEM-VINDO DE VOLTA</p><h1>Continue sua<br/><em>evolução.</em></h1><p className="auth-subtitle">Entre para retomar de onde parou.</p>
      <form onSubmit={login} className="auth-form">
        <label>E-mail<div className="auth-field"><Mail size={18}/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com"/></div></label>
        <label>Senha <Link href="/recuperar-senha">Esqueci minha senha</Link><div className="auth-field"><LockKeyhole size={18}/><input required minLength={6} type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/><button type="button" aria-label={showPassword?'Ocultar senha':'Mostrar senha'} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <button className="auth-submit" disabled={loading}>{loading?'Entrando...':'Entrar'}<ArrowRight size={18}/></button>
        {message&&<p className="auth-message-text" role="alert">{message}</p>}
      </form><p className="auth-switch">Ainda não tem uma conta? <Link href="/cadastro">Comece agora</Link></p>
    </div>
  </section></main>
}
