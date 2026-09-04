'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronRight, FlaskConical, Flame, Gift, Heart, Plus, Rocket, Trophy, UserPlus, UsersRound, Vote } from 'lucide-react'
import { challenge, circles, labInProgress, labLaunched, loadCommunity, saveCommunity, seasonVotes, seedPosts, voteFeatures, type CommunityState } from '@/lib/community'

const tabs = [
  { id: 'mural', label: 'Mural' },
  { id: 'desafios', label: 'Desafios' },
  { id: 'circulos', label: 'Círculos' },
  { id: 'lab', label: 'Aprumo Lab' },
  { id: 'votacao', label: 'Votação' },
] as const
type TabId = (typeof tabs)[number]['id']

export default function Comunidade() {
  const [tab, setTab] = useState<TabId>('mural')
  const [state, setState] = useState<CommunityState>({ likes: [], joined: [], vote: null, posts: [] })
  const [draft, setDraft] = useState('')

  useEffect(() => { setState(loadCommunity()) }, [])
  const commit = (next: CommunityState) => { setState(next); saveCommunity(next) }

  const toggleLike = (id: string) => commit({ ...state, likes: state.likes.includes(id) ? state.likes.filter(x => x !== id) : [...state.likes, id] })
  const publish = () => {
    const text = draft.trim()
    if (text.length < 2) return
    const post = { id: crypto.randomUUID(), name: 'Você', handle: '@voce', text, meta: 'Você · agora', likes: 0, own: true }
    commit({ ...state, posts: [post, ...state.posts] })
    setDraft('')
  }
  const joinChallenge = () => commit({ ...state, joined: state.joined.includes(challenge.id) ? state.joined : [...state.joined, challenge.id] })
  const castVote = (id: string) => commit({ ...state, vote: id })

  const feed = [...state.posts, ...seedPosts]
  const joined = state.joined.includes(challenge.id)
  const totalVotes = seasonVotes + (state.vote ? 1 : 0)

  return <div className="page-wrap">
    <header className="mb-8">
      <p className="eyebrow">Os Aprumados</p>
      <h1 className="display mt-3 max-w-2xl text-4xl font-semibold md:text-6xl">Evolua por você.<br/>Não sozinho.</h1>
      <p className="muted mt-4 max-w-xl">Comunidade não é um extra. Aqui você acompanha, desafia e constrói o Aprumo junto de quem também está no jogo.</p>
    </header>

    <nav className="mb-7 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition" style={{ borderColor: tab === t.id ? 'var(--energy)' : 'var(--line)', background: tab === t.id ? 'var(--energy)' : 'transparent', color: tab === t.id ? '#11130f' : 'var(--muted)' }}>{t.label}</button>)}
    </nav>

    <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {tab === 'mural' && <div className="grid gap-5 lg:grid-cols-[1.5fr_.8fr]">
        <main className="space-y-3">
          <div className="surface p-5">
            <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Compartilhe um progresso, aprendizado ou vitória…" className="field min-h-[84px] resize-none" maxLength={280}/>
            <div className="mt-3 flex items-center justify-between"><span className="muted text-xs">{draft.length}/280</span><button onClick={publish} disabled={draft.trim().length < 2} className="inline-flex items-center gap-2 rounded-full bg-energy px-4 py-2 text-sm font-semibold text-[#11130f] disabled:opacity-40"><Plus size={15}/> Publicar</button></div>
          </div>
          {feed.map(post => {
            const liked = state.likes.includes(post.id)
            return <article key={post.id} className="surface p-6">
              <div className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/5 text-sm font-bold">{post.name.slice(0, 2).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="leading-relaxed"><strong>{post.name}</strong> {post.text}</p>
                  {post.badge && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-energy/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-energy"><Trophy size={11}/> {post.badge}</span>}
                  <div className="mt-3 flex items-center gap-4"><span className="muted text-xs">{post.meta}</span><button onClick={() => toggleLike(post.id)} className="inline-flex items-center gap-1.5 text-xs" style={{ color: liked ? 'var(--energy)' : 'var(--muted)' }}><Heart size={14} fill={liked ? 'currentColor' : 'none'}/> {post.likes + (liked ? 1 : 0)}</button></div>
                </div>
              </div>
            </article>
          })}
        </main>
        <aside className="space-y-4">
          <section className="surface p-6"><UsersRound className="text-energy"/><h2 className="mt-4 text-lg font-semibold">Você não está sozinho</h2><p className="muted mt-2 text-sm">827 Aprumados priorizaram o essencial hoje. Siga amigos e acompanhe a evolução deles.</p></section>
          <section className="surface p-6"><Flame className="text-energy"/><h2 className="mt-4 font-semibold">Desafio da semana</h2><p className="muted mt-2 text-sm">{challenge.title} — {challenge.participants.toLocaleString('pt-BR')} participantes.</p><button onClick={() => setTab('desafios')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-energy">Ver desafio <ChevronRight size={15}/></button></section>
        </aside>
      </div>}

      {tab === 'desafios' && <div className="space-y-5">
        <section className="surface relative overflow-hidden p-7">
          <Trophy className="absolute -right-6 -top-6 h-32 w-32 text-energy/[.06]"/>
          <p className="eyebrow">Desafio #{challenge.id}</p>
          <h2 className="display mt-3 text-3xl font-semibold uppercase md:text-4xl">{challenge.title}</h2>
          <p className="muted mt-3 max-w-md">{challenge.tagline}</p>
          <p className="muted mt-4 text-sm">{challenge.participants.toLocaleString('pt-BR')} participantes · recompensa: XP + badge 🏆 Fora da Toca 2026</p>
          {joined ? <div className="mt-5"><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-energy">Você está dentro</span><span className="muted">Dia 1 de {challenge.days}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-energy" style={{ width: `${100 / challenge.days}%` }}/></div></div>
            : <button onClick={joinChallenge} className="mt-5 inline-flex items-center gap-2 rounded-full bg-energy px-5 py-2.5 text-sm font-semibold text-[#11130f]">Entrar no desafio <ChevronRight size={16}/></button>}
        </section>
        <section className="surface p-6">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60">Em breve</span>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3"><Gift className="text-energy" size={20}/><p className="text-sm">Desafios com <strong>prêmios físicos</strong>: camisa, caderno, Kindle.</p></div>
            <div className="flex items-center gap-3"><UserPlus className="text-energy" size={20}/><p className="text-sm"><strong>Indique e ganhe</strong>: convide amigos e desbloqueie recompensas.</p></div>
          </div>
        </section>
      </div>}

      {tab === 'circulos' && <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2">
          {circles.map(circle => <div key={circle.name} className="surface flex items-center justify-between p-5">
            <div><p className="font-semibold">{circle.name}</p><p className="muted mt-1 text-xs">{circle.tag} · {circle.members} membros</p></div>
            <button className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-energy">Entrar</button>
          </div>)}
        </section>
        <button className="surface flex w-full items-center gap-3 p-5 text-left"><span className="grid h-10 w-10 place-items-center rounded-full bg-energy/10 text-energy"><Plus size={18}/></span><div><p className="font-semibold">Criar um círculo</p><p className="muted text-xs">Um espaço de feed e foco para o seu grupo.</p></div></button>
      </div>}

      {tab === 'lab' && <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface p-6">
          <div className="flex items-center gap-2"><FlaskConical className="text-energy" size={18}/><h2 className="font-semibold">Em desenvolvimento</h2></div>
          <p className="muted mt-2 text-sm">O Aprumo está sendo construído em público. Acompanhe o que vem por aí.</p>
          <div className="mt-5 space-y-4">{labInProgress.map(item => <div key={item.label}><div className="mb-1.5 flex justify-between text-sm"><span>{item.label}</span><span className="muted">{item.pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-energy" style={{ width: `${item.pct}%` }}/></div></div>)}</div>
        </section>
        <section className="surface p-6">
          <div className="flex items-center gap-2"><Rocket className="text-energy" size={18}/><h2 className="font-semibold">Lançado</h2></div>
          <div className="mt-5 space-y-2">{labLaunched.map(name => <div key={name} className="flex items-center gap-3 rounded-2xl border border-white/[.07] p-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-energy text-[#11130f]"><Check size={15}/></span><span className="text-sm font-semibold">{name}</span></div>)}</div>
        </section>
      </div>}

      {tab === 'votacao' && <div className="space-y-5">
        <section className="surface p-6">
          <div className="flex items-center gap-2"><Vote className="text-energy" size={18}/><p className="eyebrow">Próxima feature Aprumo</p></div>
          <h2 className="mt-2 text-xl font-semibold">Você decide o próximo ciclo</h2>
          <p className="muted mt-2 text-sm">1 Aprumado = 1 voto · {totalVotes.toLocaleString('pt-BR')} votos nesta temporada. Free também vota — participar da construção não é benefício premium.</p>
        </section>
        <section className="grid gap-3">
          {voteFeatures.map(feature => {
            const chosen = state.vote === feature.id
            const count = feature.votes + (chosen ? 1 : 0)
            return <div key={feature.id} className="surface flex items-center gap-4 p-5" style={{ borderColor: chosen ? 'rgba(208,224,39,.5)' : undefined }}>
              <span className="text-2xl">{feature.emoji}</span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{feature.title}</p><p className="muted mt-1 text-sm">{feature.desc}</p><p className="muted mt-1.5 text-xs">{count.toLocaleString('pt-BR')} votos</p></div>
              <button onClick={() => castVote(feature.id)} disabled={chosen} className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition" style={{ background: chosen ? 'transparent' : 'var(--energy)', color: chosen ? 'var(--energy)' : '#11130f', border: chosen ? '1px solid rgba(208,224,39,.5)' : 'none' }}>{chosen ? 'Votado' : 'Votar'}</button>
            </div>
          })}
        </section>
      </div>}
    </motion.div>
  </div>
}
