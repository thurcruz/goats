'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Check, Clock3, Plus, Repeat2, X } from 'lucide-react'
import { useAprumoStore } from '@/lib/store'
import type { TaskCategory } from '@/lib/types'

const iso = (date: Date) => date.toISOString().slice(0, 10)

export default function AgendaPage() {
  const { store, addTask, updateTask } = useAprumoStore()
  const [selected, setSelected] = useState(iso(new Date()))
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState(30)
  const [category, setCategory] = useState<TaskCategory>('hoje')
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return date }), [])
  const tasks = store.tasks.filter(task => task.category === 'fixa' || (task.scheduledDate ?? iso(new Date())) === selected).sort((a,b)=>(a.startTime??'23:59').localeCompare(b.startTime??'23:59'))

  function create() {
    if (!title.trim()) return
    addTask({ id: crypto.randomUUID(), title: title.trim(), category, completed: false, createdAt: new Date().toISOString(), scheduledDate: selected, startTime: time, durationMinutes: duration })
    setTitle(''); setOpen(false)
  }

  return <div className="page-wrap">
    <header className="flex items-end justify-between gap-5"><div><p className="eyebrow">Tempo com intenção</p><h1 className="display mt-3 text-4xl font-semibold md:text-6xl">Agenda</h1><p className="muted mt-4">Tarefas, hábitos e compromissos organizados no mesmo dia.</p></div><button className="energy-button flex items-center gap-2 px-5 py-3" onClick={()=>setOpen(true)}><Plus size={17}/> Agendar</button></header>
    <section className="agenda-days mt-9">{days.map(date=>{const value=iso(date);return <button key={value} className={selected===value?'active':''} onClick={()=>setSelected(value)}><small>{new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(date)}</small><strong>{date.getDate()}</strong></button>})}</section>
    <section className="surface mt-5 overflow-hidden p-5 md:p-7"><div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">{new Intl.DateTimeFormat('pt-BR',{dateStyle:'full'}).format(new Date(`${selected}T12:00:00`))}</p><h2 className="mt-2 text-2xl font-semibold">{tasks.length} itens no dia</h2></div><CalendarDays className="text-energy"/></div><div className="agenda-timeline">{tasks.length?tasks.map(task=><article key={task.id} className={task.completed?'done':''}><time>{task.startTime??'Livre'}</time><button onClick={()=>updateTask({...task,completed:!task.completed,completedAt:!task.completed?new Date().toISOString():undefined},selected)}><span>{task.completed&&<Check size={13}/>}</span><div><strong>{task.title}</strong><small>{task.category==='fixa'?<><Repeat2 size={11}/> Hábito diário</>:<><Clock3 size={11}/> {task.durationMinutes??30} min</>}</small></div></button></article>):<div className="py-16 text-center"><CalendarDays className="mx-auto text-energy"/><p className="mt-4 font-semibold">Dia livre</p><p className="muted mt-1 text-sm">Agende algo ou preserve este espaço.</p></div>}</div></section>
    {open&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={()=>setOpen(false)}><div className="surface w-full max-w-md p-6" onClick={event=>event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="eyebrow">Novo horário</p><h2 className="mt-1 text-2xl font-semibold">Agendar compromisso</h2></div><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div><input autoFocus className="field mt-6" value={title} onChange={e=>setTitle(e.target.value)} placeholder="O que você vai fazer?"/><div className="mt-4 grid grid-cols-2 gap-3"><label className="muted text-xs">Horário<input className="field mt-2" type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label className="muted text-xs">Duração<input className="field mt-2" type="number" min="5" max="1440" value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label></div><label className="muted mt-4 block text-xs">Tipo<select className="field mt-2" value={category} onChange={e=>setCategory(e.target.value as TaskCategory)}><option value="hoje">Tarefa</option><option value="fixa">Hábito diário</option><option value="repasse">Repassada</option></select></label><button className="energy-button mt-6 w-full py-3" onClick={create}>Salvar na agenda</button></div></div>}
  </div>
}
