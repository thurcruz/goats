'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw, TimerReset } from 'lucide-react'

export default function FocoPage() {
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'focus'|'break'>('focus')
  const total = (phase === 'focus' ? focusMinutes : breakMinutes) * 60
  const progress = Math.max(0, Math.min(1, remaining / total))
  const stroke = 2 * Math.PI * 132

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setRemaining(value => {
      if (value > 1) return value - 1
      setRunning(false)
      if (phase === 'focus' && breakMinutes > 0) { setPhase('break'); return breakMinutes * 60 }
      setPhase('focus'); return focusMinutes * 60
    }), 1000)
    return () => window.clearInterval(timer)
  }, [running, phase, focusMinutes, breakMinutes])

  const label = useMemo(() => `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`, [remaining])
  function reset(nextPhase: 'focus'|'break' = 'focus') { setRunning(false); setPhase(nextPhase); setRemaining((nextPhase==='focus'?focusMinutes:breakMinutes)*60) }

  return <div className="page-wrap focus-page"><header><p className="eyebrow">Presença antes de velocidade</p><h1 className="display mt-3 text-4xl font-semibold md:text-6xl">Modo Foco</h1><p className="muted mt-4">Escolha um tempo, elimine o ruído e faça apenas uma coisa.</p></header><section className="focus-stage mt-10"><div className="focus-main"><svg viewBox="0 0 300 300" aria-hidden="true"><circle className="track" cx="150" cy="150" r="132"/><circle className="progress" cx="150" cy="150" r="132" style={{strokeDasharray:stroke,strokeDashoffset:stroke*(1-progress)}}/></svg><div><small>{phase==='focus'?'TEMPO DE FOCO':'PAUSA'}</small><strong>{label}</strong><button onClick={()=>setRunning(value=>!value)}>{running?<Pause size={25}/>:<Play size={25} fill="currentColor"/>}</button></div></div>{breakMinutes>0&&<button className="focus-break" onClick={()=>reset('break')}><span><TimerReset size={17}/></span><small>Pausa</small><strong>{breakMinutes}:00</strong></button>}</section><section className="surface focus-controls mt-9"><label>Foco<div>{[15,25,45,60].map(value=><button key={value} className={focusMinutes===value?'active':''} onClick={()=>{setFocusMinutes(value);if(phase==='focus'){setRemaining(value*60);setRunning(false)}}}>{value} min</button>)}</div></label><label>Pausa opcional<div>{[0,5,10,15].map(value=><button key={value} className={breakMinutes===value?'active':''} onClick={()=>setBreakMinutes(value)}>{value===0?'Sem pausa':`${value} min`}</button>)}</div></label><button className="focus-reset" onClick={()=>reset()}><RotateCcw size={16}/> Reiniciar</button></section></div>
}
