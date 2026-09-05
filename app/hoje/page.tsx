'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Check, CheckSquare, ChevronDown, Circle, Plus, RotateCcw, Target, Timer } from 'lucide-react'
import { useAprumoStore } from '@/lib/store'
import { dayBlocks, type DayBlock, type Task } from '@/lib/types'
import { PlusGate } from '@/components/plus/PlusGate'

const moods = ['😞','😕','😐','🙂','🔥'] as const
const subAreas = [
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/tarefas', label: 'Hábitos', icon: CheckSquare },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/foco', label: 'Foco', icon: Timer },
]

export default function HojePage() {
  const { store, addTask, updateTask, carryTask, addMood } = useAprumoStore()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [openMenu, setOpenMenu] = useState<string|null>(null)
  const [dragging, setDragging] = useState<string|null>(null)
  const [minimalDay, setMinimalDay] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  // O que pertence ao dia de hoje:
  // - com data: só se for hoje ou anterior (atrasada); datas futuras ficam de fora
  // - sem data: hábitos e tarefas soltas aparecem todo dia
  const visible = useMemo(() => store.tasks.filter(task =>
    task.scheduledDate ? task.scheduledDate.slice(0, 10) <= today : true
  ), [store.tasks, today])

  const grouped = useMemo(() => {
    const map: Record<DayBlock, Task[]> = { manha: [], tarde: [], noite: [], livre: [] }
    for (const task of visible) map[task.dayBlock ?? 'livre'].push(task)
    return map
  }, [visible])

  const done = visible.filter(t => t.completed).length
  const essentials = visible.filter(t => t.priority === 1 && !t.completed)
  const focusToday = (store.focusSessions ?? [])
    .filter(s => s.status === 'completed' && s.startedAt.slice(0, 10) === today)
    .reduce((sum, s) => sum + s.actualSeconds / 60, 0)

  function create(block: DayBlock) {
    const title = (drafts[block] ?? '').trim()
    if (title.length < 2) return
    addTask({ id: crypto.randomUUID(), title, category: 'hoje', completed: false, createdAt: new Date().toISOString(), dayBlock: block, priority: 2, source: 'manual', scheduledDate: today })
    setDrafts(d => ({ ...d, [block]: '' }))
  }

  const toggle = (task: Task) => updateTask({ ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined }, today)
  const moveTo = (task: Task, block: DayBlock) => { setOpenMenu(null); if ((task.dayBlock ?? 'livre') !== block) updateTask({ ...task, dayBlock: block }, today) }
  const setEssential = (task: Task) => { setOpenMenu(null); updateTask({ ...task, priority: task.priority === 1 ? 2 : 1 }, today) }
  const notToday = (task: Task) => { setOpenMenu(null); carryTask(task, today) }

  return <div className="page-wrap" onClick={() => setOpenMenu(null)}>
    <header className="mb-8">
      <p className="eyebrow">{date}</p>
      <h1 className="display mt-3 max-w-2xl text-4xl font-semibold md:text-6xl">Como vai ser<br/>o seu dia?</h1>
      <p className="muted mt-4 max-w-xl">
        {visible.length === 0
          ? 'Conte o que precisa acontecer. A organização vem depois.'
          : `${done} de ${visible.length} concluídas${focusToday > 0 ? ` · ${Math.round(focusToday)} min focados` : ''}.`}
      </p>
    </header>

    <nav className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      {subAreas.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="surface flex items-center gap-3 p-4 text-white no-underline"><Icon size={18} className="shrink-0 text-energy"/><span className="text-sm font-semibold">{label}</span></Link>)}
    </nav>

    {visible.length > 0 && <button
      onClick={() => setMinimalDay(v => !v)}
      className="surface mb-5 flex w-full items-center gap-3 p-4 text-left"
      style={{ borderColor: minimalDay ? 'rgba(208,224,39,.5)' : undefined }}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-energy/10 text-energy"><Circle size={16}/></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{minimalDay ? 'Dia mínimo ativado' : 'Hoje está difícil?'}</p>
        <p className="muted text-xs">{minimalDay
          ? essentials.length > 0 ? `Preservando ${essentials.length} ${essentials.length === 1 ? 'ação essencial' : 'ações essenciais'}. O resto pode esperar.` : 'Marque de 1 a 3 ações como essenciais no menu de cada tarefa.'
          : 'Ative o dia mínimo e preserve só o essencial. Rotina perfeita não existe.'}</p>
      </div>
    </button>}

    <div className="grid gap-4 md:grid-cols-2">
      {dayBlocks.map(block => {
        const tasks = grouped[block.id]
        return <section
          key={block.id}
          onDragOver={event => { event.preventDefault() }}
          onDrop={event => { event.preventDefault(); const task = visible.find(t => t.id === dragging); if (task) moveTo(task, block.id); setDragging(null) }}
          className="surface p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-semibold">{block.label}</h2>
            <span className="muted text-xs">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 && <p className="muted rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs">Nada aqui ainda</p>}
            {tasks.map(task => {
              const dimmed = minimalDay && task.priority !== 1 && !task.completed
              return <div
                key={task.id}
                draggable
                onDragStart={() => setDragging(task.id)}
                onDragEnd={() => setDragging(null)}
                className="relative flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-3 transition"
                style={{ opacity: dimmed ? .35 : 1, borderColor: task.priority === 1 && !task.completed ? 'rgba(208,224,39,.4)' : undefined }}>
                <button onClick={() => toggle(task)} aria-label={task.completed ? 'Desmarcar' : 'Concluir'} className="grid h-6 w-6 shrink-0 place-items-center rounded-full border" style={{ background: task.completed ? 'var(--energy)' : 'transparent', borderColor: task.completed ? 'var(--energy)' : 'rgba(255,255,255,.18)', color: '#11130f' }}>{task.completed && <Check size={14}/>}</button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${task.completed ? 'text-white/35 line-through' : 'text-white'}`}>{task.title}</p>
                  {task.category === 'repasse' && <p className="muted text-[10px]">adiada</p>}
                </div>
                <button onClick={event => { event.stopPropagation(); setOpenMenu(openMenu === task.id ? null : task.id) }} aria-label="Ações" className="muted shrink-0 rounded-lg p-1 hover:text-white"><ChevronDown size={15}/></button>

                {openMenu === task.id && <div onClick={event => event.stopPropagation()} className="glass absolute right-2 top-11 z-30 w-52 rounded-2xl p-2 text-sm">
                  <p className="muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Mover para</p>
                  {dayBlocks.filter(b => b.id !== (task.dayBlock ?? 'livre')).map(b => <button key={b.id} onClick={() => moveTo(task, b.id)} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/5">{b.label}</button>)}
                  <div className="my-1 border-t border-white/10"/>
                  <button onClick={() => setEssential(task)} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/5">{task.priority === 1 ? 'Remover de essencial' : 'Marcar como essencial'}</button>
                  <button onClick={() => notToday(task)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5"><RotateCcw size={13}/> Não consegui hoje</button>
                </div>}
              </div>
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              value={drafts[block.id] ?? ''}
              onChange={event => setDrafts(d => ({ ...d, [block.id]: event.target.value }))}
              onKeyDown={event => { if (event.key === 'Enter') create(block.id) }}
              placeholder="Adicionar…"
              maxLength={160}
              className="field py-2 text-sm"/>
            <button onClick={() => create(block.id)} aria-label={`Adicionar em ${block.label}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-energy text-[#11130f]"><Plus size={17}/></button>
          </div>
        </section>
      })}
    </div>

    <section className="surface mt-5 p-6">
      <p className="eyebrow">Como você está hoje?</p>
      <div className="mt-5 flex justify-between">{moods.map((mood, index) => <button key={mood} onClick={() => addMood({ id: crypto.randomUUID(), date: new Date().toISOString(), mood: (index + 1) as 1|2|3|4|5 })} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[.03] text-xl transition hover:-translate-y-1 hover:border-energy/50">{mood}</button>)}</div>
      <p className="muted mt-4 text-xs">Leva 2 segundos e ajuda a entender seus padrões.</p>
    </section>

    <section className="mt-5">
      <PlusGate title="Entenda sua semana, não só registre" description="Constância detalhada, disciplina, taxa de repasses e padrões semanais. A Pri transforma seus registros em análise e planejamento.">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-6">
          <p className="eyebrow">Insights da Pri</p>
          <h2 className="mt-2 text-xl font-semibold">Sua semana em análise</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[.07] p-4"><p className="muted text-xs">Concluídas</p><p className="mt-1 text-2xl font-semibold">{done}</p></div>
            <div className="rounded-2xl border border-white/[.07] p-4"><p className="muted text-xs">Adiadas</p><p className="mt-1 text-2xl font-semibold">{store.metrics.carriedCommitments}</p></div>
            <div className="rounded-2xl border border-white/[.07] p-4"><p className="muted text-xs">Foco hoje</p><p className="mt-1 text-2xl font-semibold">{Math.round(focusToday)}m</p></div>
          </div>
          <Link href="/pri" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-energy no-underline">Ver relatório completo <ArrowRight size={15}/></Link>
        </motion.div>
      </PlusGate>
    </section>
  </div>
}
