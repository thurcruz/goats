import type { GoatStore } from './types'

export interface Achievement { id: string; label: string; desc: string; icon: string; unlocked: boolean }
export interface XpSummary { xp: number; level: number; intoLevel: number; perLevel: number; achievements: Achievement[] }

const PER_LEVEL = 250

/** Deriva XP, nível e conquistas a partir dos dados já existentes no store (não persiste nada). */
export function computeXp(store: GoatStore): XpSummary {
  const completedTasks = store.tasks.filter(task => task.completed).length
  const readBooks = store.books.filter(book => book.status === 'lido').length
  const doneWorkouts = store.workouts.filter(workout => workout.completedAt).length
  const repertoire = store.repertoire?.length ?? 0
  const sleepLogs = store.sleep?.length ?? 0
  const milestones = store.goals.reduce((sum, goal) => sum + goal.milestones.filter(milestone => milestone.completed).length, 0)

  const xp =
    completedTasks * 10 +
    store.metrics.streak * 5 +
    readBooks * 40 +
    doneWorkouts * 25 +
    repertoire * 8 +
    sleepLogs * 5 +
    milestones * 15 +
    store.metrics.completedGoals * 60

  const achievements: Achievement[] = [
    { id: 'first-week', label: 'Primeira Semana', desc: '7 dias seguidos em movimento', icon: '🔥', unlocked: store.metrics.streak >= 7 },
    { id: 'reader', label: 'Leitor', desc: 'Concluiu 1 livro', icon: '📚', unlocked: readBooks >= 1 },
    { id: 'athlete', label: 'Fora da Toca', desc: 'Completou 1 treino', icon: '🏋️', unlocked: doneWorkouts >= 1 },
    { id: 'curator', label: 'Curador', desc: '5 itens no repertório', icon: '🧠', unlocked: repertoire >= 5 },
    { id: 'rested', label: 'Descansado', desc: '3 noites registradas', icon: '🌙', unlocked: sleepLogs >= 3 },
    { id: 'achiever', label: 'Realizador', desc: 'Concluiu 1 meta', icon: '🎯', unlocked: store.metrics.completedGoals >= 1 },
  ]

  return { xp, level: Math.floor(xp / PER_LEVEL) + 1, intoLevel: xp % PER_LEVEL, perLevel: PER_LEVEL, achievements }
}
