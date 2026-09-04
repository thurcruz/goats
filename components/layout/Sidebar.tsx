'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bot, Brain, CircleDollarSign, HeartPulse, Settings, Sparkles, UserRound, UsersRound, Zap } from 'lucide-react'

const primary = [
  { href: '/dashboard', label: 'Performance', icon: Zap },
  { href: '/comunidade', label: 'Comunidade', icon: UsersRound },
  { href: '/saude', label: 'Saúde', icon: HeartPulse },
  { href: '/financeiro', label: 'Financeiro', icon: CircleDollarSign },
  { href: '/conhecimento', label: 'Conhecimento', icon: Brain },
]
const system = [
  { href: '/apri', label: 'Apri', icon: Bot },
  { href: '/perfil', label: 'Minha evolução', icon: UserRound },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [name, setName] = useState('')
  useEffect(() => {
    let active = true
    void fetch('/api/profile').then(response => response.ok ? response.json() : null).then(data => {
      if (active && data?.profile?.display_name) setName(data.profile.display_name)
    }).catch(() => undefined)
    return () => { active = false }
  }, [])
  const initials = name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'A'
  const group = (items: typeof primary) => items.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`)
    return <Link key={href} href={href} className="flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] no-underline transition-all" style={{ color: active ? '#11130f' : '#a3a59e', background: active ? 'var(--energy)' : 'transparent' }}><Icon size={17}/><span>{label}</span></Link>
  })
  return <aside className="glass fixed bottom-5 left-5 top-5 z-40 hidden w-[224px] flex-col overflow-hidden rounded-[28px] p-4 md:flex">
    <Link href="/dashboard" className="mb-4 flex shrink-0 items-center gap-3 px-2 text-white no-underline"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-energy text-[#11130f]"><Sparkles size={20}/></span><div><strong className="tracking-[.16em]">APRUMO</strong><p className="muted text-[10px]">EVOLUA TODO DIA</p></div></Link>
    <div className="sidebar-menu-scroll min-h-0 flex-1 overflow-y-auto pr-1"><nav className="space-y-1">{group(primary)}</nav><p className="muted mb-2 mt-5 px-3 text-[9px] font-bold uppercase tracking-[.16em]">Atravessa tudo</p><nav className="space-y-1">{group(system)}</nav></div>
    <Link href="/perfil" className="mt-3 flex shrink-0 items-center gap-3 border-t border-white/[.07] px-2 pt-3 text-white no-underline"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-bold">{initials}</div><div className="min-w-0"><p className="truncate text-xs font-semibold">{name || 'Sua conta'}</p><p className="muted truncate text-[9px]">Sua conta</p></div></Link>
  </aside>
}
