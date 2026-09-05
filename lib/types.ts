export type TaskCategory = 'fixa' | 'hoje' | 'repasse'

export interface Task {
  id: string
  title: string
  category: TaskCategory
  completed: boolean
  completedAt?: string
  createdAt: string
  color?: string
  goalId?: string
  scheduledDate?: string
  startTime?: string
  durationMinutes?: number
}

export type GoalCategory = 'carreira' | 'saude' | 'financeiro' | 'relacionamentos' | 'conhecimento'

export interface Milestone {
  id: string
  title: string
  completed: boolean
  dueDate?: string
}

export interface Goal {
  id: string
  title: string
  description: string
  category: GoalCategory
  deadline: string
  progress: number
  milestones: Milestone[]
  linkedTasks: string[]
}

export type TransactionType = 'entrada' | 'saida'

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: string
  createdAt: string
}

export interface FinancialGoal {
  id: string
  title: string
  target: number
  current: number
}

export interface Addiction {
  id: string
  name: string
  startDate: string
  dailyCost?: number
  relapses: RelapseEntry[]
  triggers: TriggerEntry[]
  contingencyPlan: string[]
}

export interface RelapseEntry {
  id: string
  date: string
  note?: string
}

export interface TriggerEntry {
  id: string
  date: string
  description?: string
  resisted: boolean
}

export interface Set {
  reps: number
  weight: number
  completed: boolean
}

export interface Exercise {
  id: string
  name: string
  sets: Set[]
}

export interface WorkoutSession {
  id: string
  name: string
  exercises: Exercise[]
  completedAt?: string
}

export type BookStatus = 'quero-ler' | 'lendo' | 'lido'

export interface Book {
  id: string
  title: string
  author: string
  status: BookStatus
  rating?: 1 | 2 | 3 | 4 | 5
  notes?: string
  startedAt?: string
  finishedAt?: string
  currentPage?: number
  totalPages?: number
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodEntry {
  id: string
  date: string
  mood: MoodLevel
  note?: string
}

export type FocusStatus = 'running' | 'completed' | 'abandoned'

export interface FocusSession {
  id: string
  commitmentId?: string
  name: string
  plannedMinutes: number
  actualSeconds: number
  interruptions: number
  reflection?: string
  status: FocusStatus
  startedAt: string
  endedAt?: string
}

export interface SleepEntry {
  id: string
  date: string
  hours: number
  quality: MoodLevel
  note?: string
}

export type RepertoireKind = 'ideia' | 'citacao' | 'aprendizado' | 'nota'

export interface RepertoireItem {
  id: string
  kind: RepertoireKind
  text: string
  source?: string
  createdAt: string
}

export interface AprumoStore {
  tasks: Task[]
  goals: Goal[]
  transactions: Transaction[]
  financialGoals: FinancialGoal[]
  addictions: Addiction[]
  workouts: WorkoutSession[]
  books: Book[]
  notes: Note[]
  moods: MoodEntry[]
  repertoire: RepertoireItem[]
  sleep: SleepEntry[]
  focusSessions: FocusSession[]
  userName: string
  purpose: string
  metrics: EvolutionMetrics
}

export interface EvolutionMetrics {
  streak: number
  completedCommitments: number
  totalCommitments: number
  carriedCommitments: number
  completedGoals: number
  periodDays: number
}
