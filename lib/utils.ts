import { Task, MoodEntry } from './types'

export function calcConstancia(tasks: Task[], date: Date): number {
  const dateStr = date.toDateString()
  const fixas = tasks.filter((t) => t.category === 'fixa')
  if (fixas.length === 0) return 0
  const done = fixas.filter(
    (t) => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === dateStr
  )
  return Math.round((done.length / fixas.length) * 100)
}

export function calcProdutividade(tasks: Task[], date: Date): number {
  const dateStr = date.toDateString()
  const hoje = tasks.filter((t) => {
    const created = new Date(t.createdAt).toDateString()
    return (t.category === 'hoje' || t.category === 'fixa') && created === dateStr
  })
  if (hoje.length === 0) return 0
  const done = hoje.filter(
    (t) => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === dateStr
  )
  return Math.round((done.length / hoje.length) * 100)
}

export function calcRepasse(tasks: Task[]): { done: number; total: number } {
  const repasse = tasks.filter((t) => t.category === 'repasse')
  const done = repasse.filter((t) => t.completed)
  return { done: done.length, total: repasse.length }
}

export function calcStreak(tasks: Task[]): number {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const c = calcConstancia(tasks, d)
    if (c > 0) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function getDaysSince(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function getHoursSince(dateStr: string): number {
  const start = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60))
}

export function moodColor(level: number): string {
  const colors: Record<number, string> = {
    1: '#DC2626',
    2: '#F59E0B',
    3: '#16A34A',
    4: '#2563EB',
    5: '#7C3AED',
  }
  return colors[level] ?? '#E5E5E5'
}

export function moodLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Ruim',
    2: 'Ok',
    3: 'Bom',
    4: 'Ótimo',
    5: 'Incrível',
  }
  return labels[level] ?? ''
}

export function moodEmoji(level: number): string {
  const emojis: Record<number, string> = {
    1: '😞',
    2: '😐',
    3: '🙂',
    4: '😊',
    5: '🚀',
  }
  return emojis[level] ?? ''
}

export function getWeekMoods(moods: MoodEntry[]): (MoodEntry | null)[] {
  const result: (MoodEntry | null)[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const entry = moods.find((m) => new Date(m.date).toDateString() === dateStr)
    result.push(entry ?? null)
  }
  return result
}

export function goalCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    carreira: '#F59E0B',
    saude: '#16A34A',
    financeiro: '#16A34A',
    relacionamentos: '#DB2777',
    conhecimento: '#2563EB',
  }
  return colors[category] ?? '#7C3AED'
}

export function goalCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    carreira: 'Carreira',
    saude: 'Saúde',
    financeiro: 'Financeiro',
    relacionamentos: 'Relacionamentos',
    conhecimento: 'Conhecimento',
  }
  return labels[category] ?? category
}
