'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, TimerReset } from 'lucide-react'
import { useAprumoStore } from '@/lib/store'
import type { FocusSession } from '@/lib/types'

type ActiveSession = { id: string; startedAt: string; plannedMinutes: number }

export default function FocoPage() {
  const { store, saveFocusSession } = useAprumoStore()
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'focus'|'break'>('focus')
  const [sessionName, setSessionName] = useState('')
  const active = useRef<ActiveSession|null>(null)

  const total = (phase === 'focus' ? focusMinutes : breakMinutes) * 60
  const progress = Math.max(0, Math.min(1, remaining / total))
  const stroke = 2 * Math.PI * 132

  const persist = (status: FocusSession['status'], actualSeconds: number) => {
    const session = active.current
    if (!session) return
    active.current = null
    saveFocusSession({
      id: session.id,
      name: sessionName.trim(),
      plannedMinutes: session.plannedMinutes,
      actualSeconds: Math.max(0, Math.round(actualSeconds)),
      interruptions: 0,
      status,
      startedAt: session.startedAt,
      endedAt: new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setRemaining(value => {
      if (value > 1) return value - 1
      setRunning(false)
      if (phase === 'focus') {
        // Sessão de foco concluída até o fim: o tempo realizado é o planejado.
        persist('completed', (active.current?.plannedMinutes ?? focusMinutes) * 60)
        if (breakMinutes > 0) { setPhase('break'); return breakMinutes * 60 }
        return focusMinutes * 60
      }
      setPhase('focus'); return focusMinutes * 60
    }), 1000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, focusMinutes, breakMinutes])

  function toggle() {
    if (!running && phase === 'focus' && !active.current) {
      active.current = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), plannedMinutes: focusMinutes }
    }
    setRunning(value => !value)
  }

  function reset(nextPhase: 'focus'|'break' = 'focus') {
    // Reiniciar no meio de uma sessão a registra como abandonada — o histórico
    // mostra o que aconteceu de verdade, não só o que deu certo.
    if (active.current && phase === 'focus') persist('abandoned', active.current.plannedMinutes * 60 - remaining)
    setRunning(false); setPhase(nextPhase); setRemaining((nextPhase === 'focus' ? focusMinutes : breakMinutes) * 60)
  }

  const label = useMemo(() => `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`, [remaining])
  const recent = (store.focusSessions ?? []).slice(0, 6)
  const totalMinutes = (store.focusSessions ?? []).filter(s => s.status === 'completed').reduce((sum, s) => sum + s.actualSeconds / 60, 0)

  return <div className="page-wrap focus-page">
    <header><p className="eyebrow">Presença antes de velocidade</p><h1 className="display mt-3 text-4xl font-semibold md:text-6xl">Modo Foco</h1><p className="muted mt-4">Escolha um tempo, elimine o ruído e faça apenas uma coisa.</p></header>

    <section className="focus-stage mt-10">
      <div className="focus-main">
        <svg viewBox="0 0 300 300" aria-hidden="true"><circle className="track" cx="150" cy="150" r="132"/><circle className="progress" cx="150" cy="150" r="132" style={{strokeDasharray:stroke,strokeDashoffset:stroke*(1-progress)}}/></svg>
        <div><small>{phase==='focus'?'TEMPO DE FOCO':'PAUSA'}</small><strong>{label}</strong><button onClick={toggle} aria-label={running?'Pausar':'Iniciar'}>{running?<Pause size={25}/>:<Play size={25} fill="currentColor"/>}</button></div>
      </div>
      {breakMinutes>0&&<button className="focus-break" onClick={()=>reset('break')}><span><TimerReset size={17}/></span><small>Pausa</small><strong>{breakMinutes}:00</strong></button>}
    </section>

    <section className="surface mt-9 p-6">
      <label className="muted block text-xs">No que você vai focar? <span className="opacity-60">(opcional)</span>
        <input className="field mt-2" value={sessionName} onChange={e=>setSessionName(e.target.value)} maxLength={160} placeholder="Ex.: Terminar a proposta"/>
      </label>
    </section>

    <section className="surface focus-controls mt-4">
      <label>Foco<div>{[15,25,45,60].map(value=><button key={value} className={focusMinutes===value?'active':''} onClick={()=>{setFocusMinutes(value);if(phase==='focus'&&!active.current){setRemaining(value*60);setRunning(false)}}}>{value} min</button>)}</div></label>
      <label>Pausa opcional<div>{[0,5,10,15].map(value=><button key={value} className={breakMinutes===value?'active':''} onClick={()=>setBreakMinutes(value)}>{value===0?'Sem pausa':`${value} min`}</button>)}</div></label>
      <button className="focus-reset" onClick={()=>reset()}><RotateCcw size={16}/> Reiniciar</button>
    </section>

    <section className="mt-9">
      <div className="mb-4 flex items-baseline justify-between"><h2 className="text-xl font-semibold">Suas sessões</h2>{totalMinutes>0&&<span className="muted text-sm">{Math.round(totalMinutes)} min focados</span>}</div>
      {recent.length===0
        ? <div className="surface p-8 text-center"><p className="text-sm font-semibold">Nenhuma sessão ainda</p><p className="muted mt-1 text-xs">Quando você concluir um tempo de foco, ele aparece aqui.</p></div>
        : <div className="space-y-2">{recent.map(session=><div key={session.id} className="surface flex items-center gap-4 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold" style={{background:session.status==='completed'?'var(--energy)':'rgba(255,255,255,.06)',color:session.status==='completed'?'#11130f':'var(--muted)'}}>{Math.round(session.actualSeconds/60)}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{session.name||'Sessão de foco'}</p><p className="muted text-xs">{session.status==='completed'?'Concluída':'Interrompida'} · planejado {session.plannedMinutes} min</p></div>
            <span className="muted shrink-0 text-xs">{new Date(session.startedAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
          </div>)}</div>}
    </section>
  </div>
}
