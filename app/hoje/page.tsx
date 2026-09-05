'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, Circle, Pin, Plus, Star, Timer, X } from 'lucide-react'
import { useAprumoStore } from '@/lib/store'
import { dayBlocks, type DayBlock, type Task } from '@/lib/types'
import { PlusGate } from '@/components/plus/PlusGate'

const moods = ['😞','😕','😐','🙂','🔥'] as const
const subAreas = [
  { href: '/tarefas', label: 'Hábitos', icon: CheckSquare },
  { href: '/foco', label: 'Foco', icon: Timer },
]

/** Data local no formato YYYY-MM-DD. Evita o deslocamento de fuso do toISOString(). */
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parse = (value: string) => new Date(`${value}T12:00:00`)
/** Segunda-feira da semana que contém a data. */
function weekStart(date: Date) {
  const result = new Date(date)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}

export default function HojePage() {
  const { store, addTask, updateTask, carryTask, addMood } = useAprumoStore()
  const today = iso(new Date())
  const [selected, setSelected] = useState(today)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [openMenu, setOpenMenu] = useState<string|null>(null)
  const [dragging, setDragging] = useState<string|null>(null)
  const [minimalDay, setMinimalDay] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })

  const isToday = selected === today
  const selectedDate = parse(selected)

  const week = useMemo(() => {
    const start = weekStart(parse(selected))
    return Array.from({ length: 7 }, (_, index) => { const d = new Date(start); d.setDate(start.getDate() + index); return d })
  }, [selected])

  /** Tarefas do dia: hábitos fixos aparecem sempre; datadas só até o dia escolhido. */
  const tasksOn = useMemo(() => (day: string) => store.tasks.filter(task =>
    task.category === 'fixa' ? true : (task.scheduledDate ? task.scheduledDate.slice(0, 10) <= day : true)
  ), [store.tasks])

  const visible = useMemo(() => tasksOn(selected), [tasksOn, selected])

  const grouped = useMemo(() => {
    const map: Record<DayBlock, Task[]> = { manha: [], tarde: [], noite: [], livre: [] }
    for (const task of visible) map[task.dayBlock ?? 'livre'].push(task)
    return map
  }, [visible])

  const done = visible.filter(t => t.completed).length
  const essentials = visible.filter(t => t.priority === 1 && !t.completed)
  const focusMinutes = (store.focusSessions ?? [])
    .filter(s => s.status === 'completed' && s.startedAt.slice(0, 10) === selected)
    .reduce((sum, s) => sum + s.actualSeconds / 60, 0)
  const selectedMood = store.moods.find(entry => iso(new Date(entry.date)) === selected)?.mood

  function create(block: DayBlock) {
    const title = (drafts[block] ?? '').trim()
    if (title.length < 2) return
    addTask({ id: crypto.randomUUID(), title, category: 'hoje', completed: false, createdAt: new Date().toISOString(), dayBlock: block, priority: 2, source: 'manual', scheduledDate: selected })
    setDrafts(d => ({ ...d, [block]: '' }))
  }

  const toggle = (task: Task) => updateTask({ ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined }, selected)
  const moveTo = (task: Task, block: DayBlock) => { setOpenMenu(null); if ((task.dayBlock ?? 'livre') !== block) updateTask({ ...task, dayBlock: block }, selected) }
  const toggleEssential = (task: Task) => updateTask({ ...task, priority: task.priority === 1 ? 2 : 1 }, selected)
  /** Fixa = hábito recorrente (sem data), o que alimenta a taxa de constância. */
  const toggleFixed = (task: Task) => updateTask(task.category === 'fixa'
    ? { ...task, category: 'hoje', scheduledDate: selected }
    : { ...task, category: 'fixa', scheduledDate: undefined }, selected)

  const monthDays = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1)
    const start = weekStart(first)
    return Array.from({ length: 42 }, (_, index) => { const d = new Date(start); d.setDate(start.getDate() + index); return d })
  }, [monthCursor])

  return <div className="page-wrap" onClick={() => setOpenMenu(null)}>
    <header className="mb-6">
      <p className="eyebrow">{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)}</p>
      <h1 className="display mt-3 max-w-2xl text-4xl font-semibold md:text-6xl">{isToday ? <>Como vai ser<br/>o seu dia?</> : <>Seu dia<br/>{selectedDate < parse(today) ? 'que passou.' : 'que vem.'}</>}</h1>
      <p className="muted mt-4 max-w-xl">
        {visible.length === 0
          ? 'Conte o que precisa acontecer. A organização vem depois.'
          : `${done} de ${visible.length} concluídas${focusMinutes > 0 ? ` · ${Math.round(focusMinutes)} min focados` : ''}.`}
      </p>
    </header>

    <section className="mb-5 flex items-center gap-2">
      <div className="flex flex-1 gap-1.5 overflow-x-auto">
        {week.map(day => {
          const value = iso(day)
          const active = value === selected
          const dayTasks = tasksOn(value)
          const dayDone = dayTasks.filter(t => t.completed).length
          const ratio = dayTasks.length ? dayDone / dayTasks.length : 0
          return <button key={value} onClick={() => setSelected(value)}
            className="flex min-w-11 flex-1 flex-col items-center gap-1 rounded-2xl border px-1 py-2 transition"
            style={{ borderColor: active ? 'var(--energy)' : 'var(--line)', background: active ? 'var(--energy)' : 'transparent', color: active ? '#11130f' : value === today ? 'var(--ink)' : 'var(--muted)' }}>
            <small className="text-[9px] font-bold uppercase">{new Intl.DateTimeFormat('pt-BR', { weekday: 'narrow' }).format(day)}</small>
            <strong className="text-sm">{day.getDate()}</strong>
            <span className="h-1 w-1 rounded-full" style={{ background: ratio === 1 && dayTasks.length > 0 ? (active ? '#11130f' : 'var(--energy)') : ratio > 0 ? (active ? 'rgba(17,19,15,.4)' : 'rgba(208,224,39,.4)') : 'transparent' }}/>
          </button>
        })}
      </div>
      <button onClick={() => setMonthOpen(true)} aria-label="Abrir calendário" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border" style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}><CalendarDays size={18}/></button>
    </section>

    <nav className="mb-5 grid grid-cols-2 gap-3">
      {subAreas.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="surface flex items-center gap-3 p-4 text-white no-underline"><Icon size={18} className="shrink-0 text-energy"/><span className="text-sm font-semibold">{label}</span></Link>)}
    </nav>

    {visible.length > 0 && <button onClick={() => setMinimalDay(v => !v)} className="surface mb-5 flex w-full items-center gap-3 p-4 text-left" style={{ borderColor: minimalDay ? 'rgba(208,224,39,.5)' : undefined }}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-energy/10 text-energy"><Circle size={16}/></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{minimalDay ? 'Dia mínimo ativado' : 'Hoje está difícil?'}</p>
        <p className="muted text-xs">{minimalDay
          ? essentials.length > 0 ? `Preservando ${essentials.length} ${essentials.length === 1 ? 'ação essencial' : 'ações essenciais'}. O resto pode esperar.` : 'Marque de 1 a 3 ações como essenciais na estrela.'
          : 'Ative o dia mínimo e preserve só o essencial. Rotina perfeita não existe.'}</p>
      </div>
    </button>}

    <div className="grid gap-4 md:grid-cols-2">
      {dayBlocks.map(block => {
        const tasks = grouped[block.id]
        return <section key={block.id}
          onDragOver={event => event.preventDefault()}
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
              const essential = task.priority === 1
              const fixed = task.category === 'fixa'
              return <div key={task.id} draggable onDragStart={() => setDragging(task.id)} onDragEnd={() => setDragging(null)}
                className="relative flex items-center gap-2 rounded-2xl border border-white/[.07] bg-white/[.025] p-3 transition"
                style={{ opacity: dimmed ? .35 : 1, borderColor: essential && !task.completed ? 'rgba(208,224,39,.4)' : undefined }}>
                <button onClick={() => toggle(task)} aria-label={task.completed ? 'Desmarcar' : 'Concluir'} className="grid h-6 w-6 shrink-0 place-items-center rounded-full border" style={{ background: task.completed ? 'var(--energy)' : 'transparent', borderColor: task.completed ? 'var(--energy)' : 'rgba(255,255,255,.18)', color: '#11130f' }}>{task.completed && <Check size={14}/>}</button>

                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  {task.category === 'repasse' && <ArrowLeft size={13} className="shrink-0 text-energy" aria-label="Veio de outro dia"/>}
                  <p className={`truncate text-sm ${task.completed ? 'text-white/35 line-through' : 'text-white'}`}>{task.title}</p>
                </div>

                <button onClick={() => toggleEssential(task)} aria-label={essential ? 'Remover de essencial' : 'Marcar como essencial'} title="Essencial" className="shrink-0 rounded-lg p-1" style={{ color: essential ? 'var(--energy)' : 'var(--muted)' }}><Star size={14} fill={essential ? 'currentColor' : 'none'}/></button>
                <button onClick={() => toggleFixed(task)} aria-label={fixed ? 'Deixar de ser fixa' : 'Tornar fixa'} title="Fixa (conta para a constância)" className="shrink-0 rounded-lg p-1" style={{ color: fixed ? 'var(--energy)' : 'var(--muted)' }}><Pin size={14} fill={fixed ? 'currentColor' : 'none'}/></button>
                <button onClick={() => carryTask(task, selected)} aria-label="Não consegui hoje" title="Não consegui hoje" className="muted shrink-0 rounded-lg p-1 hover:text-energy"><ArrowRight size={14}/></button>
                <button onClick={event => { event.stopPropagation(); setOpenMenu(openMenu === task.id ? null : task.id) }} aria-label="Mover" className="muted shrink-0 rounded-lg p-1 hover:text-white"><ChevronDown size={14}/></button>

                {openMenu === task.id && <div onClick={event => event.stopPropagation()} className="glass absolute right-2 top-11 z-30 w-44 rounded-2xl p-2 text-sm">
                  <p className="muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Mover para</p>
                  {dayBlocks.filter(b => b.id !== (task.dayBlock ?? 'livre')).map(b => <button key={b.id} onClick={() => moveTo(task, b.id)} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-white/5">{b.label}</button>)}
                </div>}
              </div>
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input value={drafts[block.id] ?? ''} onChange={event => setDrafts(d => ({ ...d, [block.id]: event.target.value }))}
              onKeyDown={event => { if (event.key === 'Enter') create(block.id) }}
              placeholder="Adicionar…" maxLength={160} className="field py-2 text-sm"/>
            <button onClick={() => create(block.id)} aria-label={`Adicionar em ${block.label}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-energy text-[#11130f]"><Plus size={17}/></button>
          </div>
        </section>
      })}
    </div>

    <section className="surface mt-5 p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Como você está{isToday ? ' hoje' : ' nesse dia'}?</p>
        {selectedMood && <span className="muted text-xs">Registrado</span>}
      </div>
      <div className="mt-5 flex justify-between">
        {moods.map((mood, index) => {
          const level = (index + 1) as 1|2|3|4|5
          const active = selectedMood === level
          return <button key={mood} onClick={() => addMood({ id: crypto.randomUUID(), date: parse(selected).toISOString(), mood: level })}
            aria-label={`Humor ${level} de 5`} aria-pressed={active}
            className="grid h-11 w-11 place-items-center rounded-full border text-xl transition hover:-translate-y-1"
            style={{ borderColor: active ? 'var(--energy)' : 'rgba(255,255,255,.1)', background: active ? 'rgba(208,224,39,.12)' : 'rgba(255,255,255,.03)', transform: active ? 'scale(1.1)' : undefined }}>{mood}</button>
        })}
      </div>
      <p className="muted mt-4 text-xs">{selectedMood ? 'Pode trocar quando quiser — vale o que você sente agora.' : 'Leva 2 segundos e ajuda a entender seus padrões.'}</p>
    </section>

    <section className="mt-5">
      <PlusGate title="Entenda sua semana, não só registre" description="Constância detalhada, disciplina, taxa de repasses e padrões semanais. A Pri transforma seus registros em análise e planejamento.">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface p-6">
          <p className="eyebrow">Insights da Pri</p>
          <h2 className="mt-2 text-xl font-semibold">Sua semana em análise</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[.07] p-4"><p className="muted text-xs">Concluídas</p><p className="mt-1 text-2xl font-semibold">{done}</p></div>
            <div className="rounded-2xl border border-white/[.07] p-4"><p className="muted text-xs">Adiadas</p><p className="mt-1 text-2xl font-semibold">{store.metrics.carriedCommitments}</p></div>
            <div className="rounded-2xl border border-white/[.07] p-4"><p className="muted text-xs">Foco no dia</p><p className="mt-1 text-2xl font-semibold">{Math.round(focusMinutes)}m</p></div>
          </div>
          <Link href="/pri" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-energy no-underline">Ver relatório completo <ArrowRight size={15}/></Link>
        </motion.div>
      </PlusGate>
    </section>

    {monthOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setMonthOpen(false)}>
      <div className="surface w-full max-w-md p-6" onClick={event => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <button aria-label="Mês anterior" className="icon-button h-9 w-9" onClick={() => setMonthCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}><ChevronLeft size={17}/></button>
          <strong className="text-sm capitalize">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(monthCursor)}</strong>
          <div className="flex gap-2">
            <button aria-label="Próximo mês" className="icon-button h-9 w-9" onClick={() => setMonthCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}><ChevronRight size={17}/></button>
            <button aria-label="Fechar" className="icon-button h-9 w-9" onClick={() => setMonthOpen(false)}><X size={17}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S','T','Q','Q','S','S','D'].map((label, index) => <small key={index} className="muted text-[10px] font-bold">{label}</small>)}
          {monthDays.map(day => {
            const value = iso(day)
            const outside = day.getMonth() !== monthCursor.getMonth()
            const count = tasksOn(value).length
            return <button key={value} onClick={() => { setSelected(value); setMonthOpen(false) }}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border text-xs transition"
              style={{ borderColor: value === selected ? 'var(--energy)' : 'transparent', background: value === today ? 'rgba(255,255,255,.05)' : 'transparent', color: outside ? 'rgba(255,255,255,.2)' : 'var(--ink)' }}>
              {day.getDate()}
              <span className="mt-0.5 h-1 w-1 rounded-full" style={{ background: count > 0 && !outside ? 'var(--energy)' : 'transparent' }}/>
            </button>
          })}
        </div>
        <Link href="/agenda" className="mt-5 flex items-center justify-center gap-2 rounded-full bg-energy py-2.5 text-sm font-semibold text-[#11130f] no-underline">Agendar com horário <ArrowRight size={15}/></Link>
      </div>
    </div>}
  </div>
}
