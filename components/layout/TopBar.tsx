'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, Sparkles, UserRound } from 'lucide-react'

export default function TopBar() {
  const pathname = usePathname()
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  return <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden">
    <Link href="/dashboard" className="flex items-center gap-2 text-white no-underline">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-energy text-[#11130f]"><Sparkles size={17}/></span>
      <strong className="text-sm tracking-[.18em]">Aprumo</strong>
    </Link>
    <div className="flex items-center gap-2">
      <Link href="/pri" aria-label="Pri" className="grid h-9 w-9 place-items-center rounded-full border" style={{ borderColor: active('/pri') ? 'rgba(208,224,39,.45)' : 'var(--line)', color: active('/pri') ? 'var(--energy)' : 'var(--ink)' }}><Bot size={18}/></Link>
      <Link href="/perfil" aria-label="Perfil" className="grid h-9 w-9 place-items-center rounded-full border" style={{ borderColor: active('/perfil') ? 'rgba(208,224,39,.45)' : 'var(--line)', color: active('/perfil') ? 'var(--energy)' : 'var(--ink)' }}><UserRound size={18}/></Link>
    </div>
  </header>
}
