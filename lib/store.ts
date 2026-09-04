'use client'

import { useState, useEffect, useCallback } from 'react'
import { AprumoStore, Task, Goal, Transaction, FinancialGoal, Addiction, WorkoutSession, Book, Note, MoodEntry, RepertoireItem, SleepEntry } from './types'

const STORAGE_KEY = 'aprumo-store'
const BACKEND_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)

const initialData: AprumoStore = {
  metrics: { streak: 0, completedCommitments: 0, totalCommitments: 0, carriedCommitments: 0, completedGoals: 0, periodDays: 30 },
  userName: 'Arthur',
  purpose: 'Ser um empreendedor independente que tem saúde e liberdade para criar.',
  tasks: [
    { id: '1', title: 'Estudar inglês 30 min', category: 'fixa', completed: false, createdAt: new Date().toISOString() },
    { id: '2', title: 'Treino do dia', category: 'fixa', completed: false, createdAt: new Date().toISOString() },
    { id: '3', title: 'Meditação 10 min', category: 'fixa', completed: false, createdAt: new Date().toISOString() },
    { id: '4', title: 'Revisar metas da semana', category: 'hoje', completed: false, createdAt: new Date().toISOString() },
    { id: '5', title: 'Terminar relatório de projeto', category: 'hoje', completed: false, createdAt: new Date().toISOString() },
    { id: '6', title: 'Ligar para cliente', category: 'repasse', completed: false, createdAt: yesterday.toISOString() },
    { id: '7', title: 'Enviar proposta freelance', category: 'repasse', completed: false, createdAt: yesterday.toISOString() },
  ],
  goals: [
    {
      id: 'g1',
      title: 'Lançar meu primeiro produto digital',
      description: 'Criar e lançar um curso online sobre design de produto',
      category: 'carreira',
      deadline: '2025-07-31',
      progress: 40,
      milestones: [
        { id: 'm1', title: 'Definir nicho e tema do produto', completed: true },
        { id: 'm2', title: 'Gravar os primeiros 3 módulos', completed: true },
        { id: 'm3', title: 'Criar página de vendas', completed: true },
        { id: 'm4', title: 'Lançamento beta', completed: false },
        { id: 'm5', title: 'Lançamento oficial', completed: false },
      ],
      linkedTasks: ['4'],
    },
    {
      id: 'g2',
      title: 'Economizar R$ 10.000',
      description: 'Fundo de emergência e investimentos',
      category: 'financeiro',
      deadline: '2025-12-31',
      progress: 25,
      milestones: [
        { id: 'm6', title: 'Guardar R$ 2.500', completed: true },
        { id: 'm7', title: 'Guardar R$ 5.000', completed: false },
        { id: 'm8', title: 'Guardar R$ 7.500', completed: false },
        { id: 'm9', title: 'Meta atingida: R$ 10.000', completed: false },
      ],
      linkedTasks: [],
    },
  ],
  transactions: [
    { id: 't1', description: 'Salário', amount: 4500, type: 'entrada', category: 'Trabalho', createdAt: new Date(new Date().setDate(1)).toISOString() },
    { id: 't2', description: 'Freelance design', amount: 800, type: 'entrada', category: 'Freelance', createdAt: new Date().toISOString() },
    { id: 't3', description: 'Aluguel', amount: 1200, type: 'saida', category: 'Moradia', createdAt: new Date().toISOString() },
    { id: 't4', description: 'Mercado', amount: 350, type: 'saida', category: 'Alimentação', createdAt: new Date().toISOString() },
    { id: 't5', description: 'Spotify', amount: 21.9, type: 'saida', category: 'Assinaturas', createdAt: yesterday.toISOString() },
  ],
  financialGoals: [
    { id: 'fg1', title: 'Notebook novo', target: 3000, current: 1200 },
    { id: 'fg2', title: 'Viagem para Portugal', target: 8000, current: 2500 },
  ],
  addictions: [
    {
      id: 'a1',
      name: 'Cigarro',
      startDate: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000).toISOString(),
      dailyCost: 8,
      relapses: [],
      triggers: [
        { id: 'tr1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Estresse no trabalho', resisted: true },
      ],
      contingencyPlan: [
        'Fazer 20 flexões',
        'Beber um copo de água',
        'Ligar para um amigo',
        'Sair para caminhar 10 min',
        'Mascar chicletes',
      ],
    },
  ],
  workouts: [
    {
      id: 'w1',
      name: 'Treino A — Peito e Tríceps',
      exercises: [
        {
          id: 'e1',
          name: 'Supino Reto',
          sets: [
            { reps: 4, weight: 60, completed: false },
            { reps: 4, weight: 60, completed: false },
            { reps: 4, weight: 55, completed: false },
          ],
        },
        {
          id: 'e2',
          name: 'Crucifixo',
          sets: [
            { reps: 12, weight: 14, completed: false },
            { reps: 12, weight: 14, completed: false },
            { reps: 10, weight: 14, completed: false },
          ],
        },
        {
          id: 'e3',
          name: 'Tríceps Corda',
          sets: [
            { reps: 12, weight: 25, completed: false },
            { reps: 12, weight: 25, completed: false },
            { reps: 10, weight: 22, completed: false },
          ],
        },
      ],
    },
    {
      id: 'w2',
      name: 'Treino B — Costas e Bíceps',
      exercises: [
        {
          id: 'e4',
          name: 'Puxada Frontal',
          sets: [
            { reps: 10, weight: 70, completed: false },
            { reps: 10, weight: 70, completed: false },
            { reps: 8, weight: 65, completed: false },
          ],
        },
        {
          id: 'e5',
          name: 'Remada Baixa',
          sets: [
            { reps: 10, weight: 65, completed: false },
            { reps: 10, weight: 65, completed: false },
            { reps: 8, weight: 60, completed: false },
          ],
        },
      ],
    },
  ],
  books: [
    { id: 'b1', title: 'O Poder do Hábito', author: 'Charles Duhigg', status: 'lido', rating: 5, notes: 'Mudou minha perspectiva sobre rotinas.' },
    { id: 'b2', title: 'Deep Work', author: 'Cal Newport', status: 'lendo', startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'b3', title: 'Princípios', author: 'Ray Dalio', status: 'quero-ler' },
  ],
  notes: [
    {
      id: 'n1',
      title: 'Princípios para tomar decisões',
      content: 'Sempre questionar: isso está me aproximando ou afastando dos meus objetivos? Agir com consistência é mais importante do que agir com perfeição.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n2',
      title: 'Ideias de produto',
      content: 'Curso de produtividade para freelancers. App de finanças pessoais minimalista. Newsletter semanal sobre design e tecnologia.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  moods: [
    { id: 'mo1', date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), mood: 3, note: 'Dia corrido mas produtivo' },
    { id: 'mo2', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), mood: 4 },
    { id: 'mo3', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), mood: 2, note: 'Estressado com prazo' },
    { id: 'mo4', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), mood: 5, note: 'Finalizei o módulo do curso!' },
    { id: 'mo5', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), mood: 4 },
    { id: 'mo6', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), mood: 3 },
  ],
  repertoire: [
    { id: 'r1', kind: 'aprendizado', text: 'Trabalho profundo precisa de um ritual de entrada.', source: 'Deep Work', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'r2', kind: 'citacao', text: 'Você não sobe ao nível dos seus objetivos; você cai ao nível dos seus sistemas.', source: 'James Clear', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  sleep: [
    { id: 's1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), hours: 7.5, quality: 4 },
    { id: 's2', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), hours: 6, quality: 3, note: 'Dormi tarde' },
  ],
}

function loadStore(): AprumoStore {
  if (typeof window === 'undefined') return initialData
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialData
    const parsed = JSON.parse(raw) as Partial<AprumoStore>
    return { ...initialData, ...parsed, metrics: parsed.metrics ?? initialData.metrics } as AprumoStore
  } catch {
    return initialData
  }
}

function saveStore(data: AprumoStore) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

async function loadProfile(): Promise<{ userName?: string; purpose?: string } | null> {
  if (!BACKEND_ENABLED) return null
  const response = await fetch('/api/profile', { cache: 'no-store' })
  if (!response.ok) return null
  const data = await response.json() as { profile?: { display_name?: string | null; purpose?: string | null } }
  return { userName: data.profile?.display_name ?? undefined, purpose: data.profile?.purpose ?? undefined }
}

function saveProfile(payload: { displayName?: string; purpose?: string }) {
  if (!BACKEND_ENABLED) return
  void fetch('/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => undefined)
}

async function loadCoreDomains(): Promise<Pick<AprumoStore, 'goals' | 'tasks' | 'metrics'> | null> {
  if (!BACKEND_ENABLED) return null
  const response = await fetch('/api/core', { cache: 'no-store' })
  if (!response.ok) return null
  return response.json() as Promise<Pick<AprumoStore, 'goals' | 'tasks' | 'metrics'>>
}

async function syncCore(action: string, payload: { task?: Task; goal?: Goal; id?: string; eventDate?: string }) {
  if (!BACKEND_ENABLED) return
  await fetch('/api/core', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...payload }) })
}

type DomainState = Pick<AprumoStore, 'moods'|'books'|'notes'|'transactions'|'financialGoals'|'addictions'|'workouts'>
async function loadDomains(): Promise<DomainState | null> {
  if (!BACKEND_ENABLED) return null
  const response = await fetch('/api/domains', { cache: 'no-store' })
  return response.ok ? response.json() as Promise<DomainState> : null
}
async function syncDomain(action:string,payload:Record<string,unknown>){if(!BACKEND_ENABLED)return;await fetch('/api/domains',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...payload})})}

export function useAprumoStore() {
  const [store, setStore] = useState<AprumoStore>(initialData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    queueMicrotask(async () => {
      const local = loadStore()
      let next = local
      try {
        const core = await loadCoreDomains()
        if (core) next = { ...next, goals: core.goals, tasks: core.tasks, metrics: core.metrics }
        const domains = await loadDomains()
        if (domains) next = { ...next, ...domains }
        const profile = await loadProfile()
        if (profile) next = { ...next, userName: profile.userName ?? next.userName, purpose: profile.purpose ?? next.purpose }
      } catch { /* Offline-first: local state remains available. */ }
      if (active) { setStore(next); saveStore(next); setHydrated(true) }
    })
    return () => { active = false }
  }, [])

  const update = useCallback((updater: (prev: AprumoStore) => AprumoStore) => {
    setStore((prev) => {
      const next = updater(prev)
      saveStore(next)
      return next
    })
  }, [])

  const addTask = useCallback((task: Task) => { update((s) => ({ ...s, tasks: [...s.tasks, task] })); void syncCore('addTask', { task }).catch(() => undefined) }, [update])
  const updateTask = useCallback((task: Task, eventDate?: string) => { update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === task.id ? task : t)) })); void syncCore('updateTask', { task, eventDate }).catch(() => undefined) }, [update])
  const deleteTask = useCallback((id: string) => { update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })); void syncCore('deleteTask', { id }).catch(() => undefined) }, [update])

  const addGoal = useCallback((goal: Goal) => { update((s) => ({ ...s, goals: [...s.goals, goal] })); void syncCore('addGoal', { goal }).catch(() => undefined) }, [update])
  const updateGoal = useCallback((goal: Goal) => { update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === goal.id ? goal : g)) })); void syncCore('updateGoal', { goal }).catch(() => undefined) }, [update])
  const deleteGoal = useCallback((id: string) => { update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })); void syncCore('deleteGoal', { id }).catch(() => undefined) }, [update])

  const addTransaction = useCallback((tx: Transaction) => {update((s) => ({ ...s, transactions: [...s.transactions, tx] }));void syncDomain('addTransaction',{transaction:tx}).catch(()=>undefined)}, [update])
  const deleteTransaction = useCallback((id: string) => {update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));void syncDomain('deleteTransaction',{id}).catch(()=>undefined)}, [update])

  const addAddiction = useCallback((a: Addiction) => {update((s) => ({ ...s, addictions: [...s.addictions, a] }));void syncDomain('addAddiction',{addiction:a}).catch(()=>undefined)}, [update])
  const updateAddiction = useCallback((a: Addiction) => {update((s) => ({ ...s, addictions: s.addictions.map((x) => (x.id === a.id ? a : x)) }));void syncDomain('updateAddiction',{addiction:a}).catch(()=>undefined)}, [update])

  const updateWorkout = useCallback((w: WorkoutSession) => {update((s) => ({ ...s, workouts: s.workouts.map((x) => (x.id === w.id ? w : x)) }));void syncDomain('updateWorkout',{workout:w}).catch(()=>undefined)}, [update])
  const addWorkout = useCallback((w: WorkoutSession) => {update((s) => ({ ...s, workouts: [...s.workouts, w] }));void syncDomain('addWorkout',{workout:w}).catch(()=>undefined)}, [update])

  const addBook = useCallback((b: Book) => {update((s) => ({ ...s, books: [...s.books, b] }));void syncDomain('addBook',{book:b}).catch(()=>undefined)}, [update])
  const updateBook = useCallback((b: Book) => {update((s) => ({ ...s, books: s.books.map((x) => (x.id === b.id ? b : x)) }));void syncDomain('updateBook',{book:b}).catch(()=>undefined)}, [update])
  const deleteBook = useCallback((id: string) => {update((s) => ({ ...s, books: s.books.filter((b) => b.id !== id) }));void syncDomain('deleteBook',{id}).catch(()=>undefined)}, [update])

  const addNote = useCallback((n: Note) => {update((s) => ({ ...s, notes: [...s.notes, n] }));void syncDomain('addNote',{note:n}).catch(()=>undefined)}, [update])
  const updateNote = useCallback((n: Note) => {update((s) => ({ ...s, notes: s.notes.map((x) => (x.id === n.id ? n : x)) }));void syncDomain('updateNote',{note:n}).catch(()=>undefined)}, [update])
  const deleteNote = useCallback((id: string) => {update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));void syncDomain('deleteNote',{id}).catch(()=>undefined)}, [update])

  const addMood = useCallback((m: MoodEntry) => update((s) => {
    const existing = s.moods.find((x) => new Date(x.date).toDateString() === new Date(m.date).toDateString())
    if (existing) return { ...s, moods: s.moods.map((x) => (x.id === existing.id ? m : x)) }
    return { ...s, moods: [...s.moods, m] }
  }), [update])
  const saveMood = useCallback((m:MoodEntry)=>{addMood(m);void syncDomain('addMood',{mood:m}).catch(()=>undefined)},[addMood])

  const setPurpose = useCallback((p: string) => { update((s) => ({ ...s, purpose: p })); saveProfile({ purpose: p }) }, [update])
  const setUserName = useCallback((n: string) => { update((s) => ({ ...s, userName: n })); saveProfile({ displayName: n }) }, [update])
  const addFinancialGoal = useCallback((fg: FinancialGoal) => {update((s) => ({ ...s, financialGoals: [...(s.financialGoals ?? []), fg] }));void syncDomain('addFinancialGoal',{financialGoal:fg}).catch(()=>undefined)}, [update])
  const updateFinancialGoal = useCallback((fg: FinancialGoal) => {update((s) => ({ ...s, financialGoals: (s.financialGoals ?? []).map((x) => (x.id === fg.id ? fg : x)) }));void syncDomain('updateFinancialGoal',{financialGoal:fg}).catch(()=>undefined)}, [update])

  const addRepertoire = useCallback((item: RepertoireItem) => update((s) => ({ ...s, repertoire: [item, ...(s.repertoire ?? [])] })), [update])
  const deleteRepertoire = useCallback((id: string) => update((s) => ({ ...s, repertoire: (s.repertoire ?? []).filter((r) => r.id !== id) })), [update])

  const addSleep = useCallback((entry: SleepEntry) => update((s) => {
    const existing = (s.sleep ?? []).find((x) => new Date(x.date).toDateString() === new Date(entry.date).toDateString())
    return existing ? { ...s, sleep: s.sleep.map((x) => (x.id === existing.id ? entry : x)) } : { ...s, sleep: [entry, ...(s.sleep ?? [])] }
  }), [update])

  return {
    store,
    hydrated,
    addTask, updateTask, deleteTask,
    addGoal, updateGoal, deleteGoal,
    addTransaction, deleteTransaction,
    addAddiction, updateAddiction,
    updateWorkout, addWorkout,
    addBook, updateBook, deleteBook,
    addNote, updateNote, deleteNote,
    addMood: saveMood,
    setPurpose,
    setUserName,
    addFinancialGoal,
    updateFinancialGoal,
    addRepertoire,
    deleteRepertoire,
    addSleep,
  }
}
