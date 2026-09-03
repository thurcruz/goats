'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, CircleDollarSign, HeartPulse, UsersRound, Zap } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Performance', icon: Zap },
  { href: '/comunidade', label: 'Comunidade', icon: UsersRound },
  { href: '/saude', label: 'Saúde', icon: HeartPulse },
  { href: '/financeiro', label: 'Financeiro', icon: CircleDollarSign },
  { href: '/conhecimento', label: 'Conhecimento', icon: Brain },
]

export default function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  return <nav className="mobile-bottom-nav glass fixed bottom-3 left-3 right-3 z-40 flex h-[72px] items-center justify-around rounded-[34px] px-1 md:hidden">
    {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-1 text-[9px] no-underline" style={{ color: isActive(href) ? 'var(--energy)' : '#8d8f88' }}><Icon size={19}/><span className="leading-none">{label}</span></Link>)}
  </nav>
}
