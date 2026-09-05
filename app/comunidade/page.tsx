'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trophy, UsersRound, Vote } from 'lucide-react'
import { loadCommunity, saveCommunity, voteFeatures, type CommunityState } from '@/lib/community'

const tabs = [
  { id: 'desafios', label: 'Desafios' },
  { id: 'circulos', label: 'Círculos' },
  { id: 'votacao', label: 'Votação' },
] as const
type TabId = (typeof tabs)[number]['id']

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof Trophy; title: string; description: string; action?: string }) {
  return <div className="surface flex flex-col items-center gap-3 p-10 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-white/50"><Icon size={22}/></span>
    <div><p className="font-semibold">{title}</p><p className="muted mx-auto mt-1 max-w-sm text-sm">{description}</p></div>
    {action && <span className="muted rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-wider">{action}</span>}
  </div>
}

export default function Comunidade() {
  const [tab, setTab] = useState<TabId>('desafios')
  const [state, setState] = useState<CommunityState>({ vote: null })

  useEffect(() => { setState(loadCommunity()) }, [])
  const castVote = (id: string) => { const next = { ...state, vote: id }; setState(next); saveCommunity(next) }

  return <div className="page-wrap">
    <header className="mb-8">
      <p className="eyebrow">Comunidade</p>
      <h1 className="display mt-3 max-w-2xl text-4xl font-semibold md:text-6xl">Evolua por você.<br/>Não sozinho.</h1>
      <p className="muted mt-4 max-w-xl">Comunidade não é um extra. Aqui você entra em desafios, participa de círculos e decide o que Aprumo constrói em seguida.</p>
    </header>

    <nav className="mb-7 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition" style={{ borderColor: tab === item.id ? 'var(--energy)' : 'var(--line)', background: tab === item.id ? 'var(--energy)' : 'transparent', color: tab === item.id ? '#11130f' : 'var(--muted)' }}>{item.label}</button>)}
    </nav>

    <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {tab === 'desafios' && <EmptyState
        icon={Trophy}
        title="Nenhum desafio ativo"
        description="Os desafios oficiais aparecem aqui assim que forem publicados. Você entra, faz check-in e acompanha seu progresso."
        action="Em breve"
      />}

      {tab === 'circulos' && <div className="space-y-4">
        <EmptyState
          icon={UsersRound}
          title="Você ainda não está em nenhum círculo"
          description="Círculos são grupos por interesse — corrida, leitura, faculdade, projetos. Cada um com seu próprio espaço."
        />
        <button disabled className="surface flex w-full items-center gap-3 p-5 text-left opacity-50" title="Disponível quando a comunidade for ativada">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-energy/10 text-energy"><Plus size={18}/></span>
          <div><p className="font-semibold">Criar um círculo</p><p className="muted text-xs">Disponível quando a comunidade for ativada.</p></div>
        </button>
      </div>}

      {tab === 'votacao' && <div className="space-y-5">
        <section className="surface p-6">
          <div className="flex items-center gap-2"><Vote className="text-energy" size={18}/><p className="eyebrow">Próxima feature</p></div>
          <h2 className="mt-2 text-xl font-semibold">Você decide o próximo ciclo</h2>
          <p className="muted mt-2 text-sm">Uma pessoa, um voto. Free também vota — participar da construção não é benefício premium. As contagens aparecem quando a votação for aberta.</p>
        </section>
        <section className="grid gap-3">
          {voteFeatures.map(feature => {
            const chosen = state.vote === feature.id
            return <div key={feature.id} className="surface flex items-center gap-4 p-5" style={{ borderColor: chosen ? 'rgba(208,224,39,.5)' : undefined }}>
              <span className="text-2xl">{feature.emoji}</span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{feature.title}</p><p className="muted mt-1 text-sm">{feature.desc}</p></div>
              <button onClick={() => castVote(feature.id)} disabled={chosen} className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition" style={{ background: chosen ? 'transparent' : 'var(--energy)', color: chosen ? 'var(--energy)' : '#11130f', border: chosen ? '1px solid rgba(208,224,39,.5)' : 'none' }}>{chosen ? 'Votado' : 'Votar'}</button>
            </div>
          })}
        </section>
      </div>}
    </motion.div>
  </div>
}
