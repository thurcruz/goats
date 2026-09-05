'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import AuthVisual from '@/components/auth/AuthVisual'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function NovaSenhaPage() {
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [done, setDone] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); if (password !== confirmation) return setMessage('As senhas não são iguais.'); setLoading(true); setMessage('')
    try { const { error } = await createSupabaseBrowserClient().auth.updateUser({ password }); if (error) setMessage(error.message); else setDone(true) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar sua senha.') }
    finally { setLoading(false) }
  }
  return <main className="auth-page"><AuthVisual/><section className="auth-panel"><Link href="/" className="brand-mark auth-mobile-brand"><span>A</span><strong>Aprumo</strong></Link><div className="auth-form-wrap"><p className="section-label">NOVA SENHA</p><h1>{done?'Acesso':'Proteja sua'}<br/><em>{done?'restaurado.':'jornada.'}</em></h1><p className="auth-subtitle">{done?'Sua senha foi atualizada com segurança.':'Escolha uma senha com pelo menos 8 caracteres.'}</p>{done?<Link href="/hoje" className="auth-submit mt-8 no-underline">Ir para Aprumo <ArrowRight size={18}/></Link>:<form onSubmit={submit} className="auth-form"><label>Nova senha<div className="auth-field"><LockKeyhole size={18}/><input required minLength={8} type={show?'text':'password'} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres"/><button type="button" aria-label="Mostrar senha" onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label><label>Confirmar nova senha<div className="auth-field"><LockKeyhole size={18}/><input required minLength={8} type={show?'text':'password'} autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} placeholder="Repita a senha"/></div></label><button className="auth-submit" disabled={loading}>{loading?'Atualizando...':'Atualizar senha'}<ArrowRight size={18}/></button>{message&&<p className="auth-message-text" role="alert">{message}</p>}</form>}</div></section></main>
}
