'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, BookOpen, CalendarDays, Check, CircleDollarSign, Edit3, Flame, Settings, Shield, Target, Trophy, X } from 'lucide-react'
import { useAprumoStore } from '@/lib/store'
import { computeXp } from '@/lib/xp'

const modules = [
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/mente', label: 'Mente', icon: BookOpen },
  { href: '/financas', label: 'Finanças', icon: CircleDollarSign },
  { href: '/antivicio', label: 'Antivício', icon: Shield },
]

export default function PerfilPage() {
  const { store, setUserName, setPurpose } = useAprumoStore()
  const [editing, setEditing] = useState(false); const [name, setName] = useState(store.userName); const [purpose, setLocalPurpose] = useState(store.purpose); const [saved, setSaved] = useState(false)
  const initials = store.userName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  const consistency = store.metrics.totalCommitments ? Math.round(store.metrics.completedCommitments / store.metrics.totalCommitments * 100) : 0
  const activeGoals = store.goals.filter(goal => goal.progress < 100).length
  const addiction = store.addictions[0]
  const addictionDays = addiction ? Math.max(0, Math.floor((Date.now() - new Date(addiction.startDate).getTime()) / 86400000)) : 0
  const xp = computeXp(store)
  const moduleDetails: Record<string, string> = {
    '/metas': `${activeGoals} em movimento`,
    '/mente': `${store.books.length} ${store.books.length === 1 ? 'livro' : 'livros'}`,
    '/financas': 'visão do mês',
    '/antivicio': addiction ? `${addictionDays} ${addictionDays === 1 ? 'dia' : 'dias'}` : 'privado',
  }
  function beginEdit() { setName(store.userName); setLocalPurpose(store.purpose); setEditing(true) }
  async function save() {
    if (!name.trim()) return
    const nextName = name.trim(); const nextPurpose = purpose.trim()
    setUserName(nextName); setPurpose(nextPurpose)
    try { await fetch('/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ displayName: nextName, purpose: nextPurpose }) }) } catch { /* The offline-first store remains available. */ }
    setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2200)
  }

  return <div className="page-wrap profile-page">
    <header className="profile-header"><div><p className="eyebrow">Minha evolução</p><h1 className="display mt-3 text-4xl font-semibold md:text-6xl">O reflexo da sua<br/><span>constância.</span></h1></div><Link href="/configuracoes" className="profile-settings"><Settings size={17}/> Configurações</Link></header>
    <section className="profile-identity surface">
      <div className="profile-avatar"><span>{initials || 'A'}</span><div className="avatar-ring"/></div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2>{store.userName}</h2></div><p>{store.purpose || 'Defina o propósito que guia sua evolução.'}</p><div className="profile-meta"><span><CalendarDays size={14}/> Sua evolução em dados</span><span><Flame size={14}/> {store.metrics.streak} dias em movimento</span></div></div>
      <button className="profile-edit" onClick={beginEdit}><Edit3 size={16}/> Editar perfil</button>
    </section>
    {saved&&<div className="profile-toast"><Check size={15}/> Perfil atualizado</div>}
    <section className="profile-stats">
      <article className="surface"><span className="stat-icon"><Flame size={20}/></span><div><small>SEQUÊNCIA ATUAL</small><strong>{store.metrics.streak} <em>dias</em></strong><p>Dias consecutivos com conclusão</p></div></article>
      <article className="surface"><span className="stat-icon"><Trophy size={20}/></span><div><small>CONSTÂNCIA · {store.metrics.periodDays} DIAS</small><strong>{consistency}<em>%</em></strong><p>{store.metrics.completedCommitments} de {store.metrics.totalCommitments} compromissos</p></div></article>
      <article className="surface"><span className="stat-icon"><Target size={20}/></span><div><small>METAS CONCLUÍDAS</small><strong>{store.metrics.completedGoals}</strong><p>{store.goals.filter(goal=>goal.progress<100).length} ainda em movimento</p></div></article>
    </section>
    <section className="surface mt-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-energy text-lg font-bold text-[#11130f]">{xp.level}</span><div><p className="eyebrow">Nível {xp.level}</p><p className="muted text-sm">{xp.xp.toLocaleString('pt-BR')} XP acumulado</p></div></div>
        <span className="muted text-sm">{xp.intoLevel}/{xp.perLevel} para o nível {xp.level + 1}</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-energy" style={{ width: `${Math.round(xp.intoLevel / xp.perLevel * 100)}%` }}/></div>
      <p className="eyebrow mt-7">Conquistas</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{xp.achievements.map(achievement => <div key={achievement.id} className="rounded-2xl border p-4" style={{ borderColor: achievement.unlocked ? 'rgba(208,224,39,.4)' : 'var(--line)', opacity: achievement.unlocked ? 1 : .45 }}><div className="flex items-center gap-2"><span className="text-xl">{achievement.icon}</span>{achievement.unlocked && <Check size={14} className="text-energy"/>}</div><p className="mt-2 text-sm font-semibold">{achievement.label}</p><p className="muted text-xs">{achievement.desc}</p></div>)}</div>
    </section>
    <div className="profile-columns"><section><div className="profile-section-title"><div><p className="eyebrow">Seu sistema</p><h3>Áreas da sua vida</h3></div><span>4 áreas ativas</span></div><div className="profile-modules">{modules.map(({href,label,icon:Icon})=><Link href={href} key={href} className="surface"><span><Icon size={19}/></span><div><strong>{label}</strong><small>{moduleDetails[href]}</small></div><ArrowUpRight size={16}/></Link>)}</div></section>
      <aside className="surface evolution-card"><p className="eyebrow">Últimos 30 dias</p><h3>{store.metrics.totalCommitments ? 'Você apareceu por você.' : 'Seu histórico começa hoje.'}</h3><div className="evolution-bars">{[35,45,55,65,75,85,Math.max(10,consistency)].map((height,i)=><div key={i}><span style={{height:`${height}%`}}/><small>{['S','T','Q','Q','S','S','D'][i]}</small></div>)}</div><p className="muted">{store.metrics.completedCommitments} de {store.metrics.totalCommitments} compromissos concluídos</p></aside>
    </div>
    {editing&&<div className="profile-modal-backdrop" onClick={()=>setEditing(false)}><div className="surface profile-modal" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><div><p className="eyebrow">Sua identidade</p><h3>Editar perfil</h3></div><button className="icon-button" onClick={()=>setEditing(false)}><X size={17}/></button></div><label>Nome<input value={name} onChange={e=>setName(e.target.value)} maxLength={60}/></label><label>Seu propósito<textarea value={purpose} onChange={e=>setLocalPurpose(e.target.value)} maxLength={180} rows={4}/><small>{purpose.length}/180</small></label><button className="energy-button py-3" onClick={save}>Salvar alterações</button></div></div>}
  </div>
}
