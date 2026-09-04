'use client'

export interface FeedPost { id: string; name: string; handle: string; text: string; badge?: string; meta: string; likes: number; own?: boolean }
export interface VoteFeature { id: string; emoji: string; title: string; desc: string; votes: number }
export interface LabItem { label: string; pct: number }
export interface Circle { name: string; tag: string; members: number }

export const seedPosts: FeedPost[] = [
  { id: 'p1', name: 'Gabriel', handle: '@gabriel', text: 'completou 7 dias de leitura seguidos.', badge: 'Primeira Semana', meta: 'Constância · agora', likes: 34 },
  { id: 'p2', name: 'Ana', handle: '@ana', text: 'concluiu sua primeira corrida de 5 km.', badge: 'Fora da Toca', meta: 'Meta · 1 h', likes: 58 },
  { id: 'p3', name: 'Pedro', handle: '@pedro', text: 'terminou Hábitos Atômicos e salvou 3 aprendizados no repertório.', meta: 'Conhecimento · 3 h', likes: 21 },
  { id: 'p4', name: 'Marina', handle: '@marina', text: 'focou 4h32 nesta semana e bateu recorde pessoal.', badge: 'Foco 2.0', meta: 'Performance · 5 h', likes: 47 },
]

export const challenge = { id: '001', title: '7 dias fora da toca', tagline: 'Saia da zona de conforto todos os dias por uma semana.', participants: 1247, days: 7 }

export const circles: Circle[] = [
  { name: 'Corrida 5K', tag: 'Saúde', members: 214 },
  { name: 'Faculdade', tag: 'Estudo', members: 96 },
  { name: 'Empreendedores', tag: 'Carreira', members: 331 },
  { name: 'Clube de leitura', tag: 'Conhecimento', members: 158 },
]

export const labInProgress: LabItem[] = [
  { label: 'Novo sistema de conquistas', pct: 72 },
  { label: 'Apri no WhatsApp', pct: 54 },
  { label: 'Relatório mensal', pct: 87 },
]
export const labLaunched = ['Doses', 'Círculos', 'Foco 2.0']

export const voteFeatures: VoteFeature[] = [
  { id: 'space', emoji: '💻', title: 'Aprumo Space', desc: 'Workspace para trabalho e estudo: Kanban, projetos, tarefas e sessões de foco.', votes: 842 },
  { id: 'coworking', emoji: '🟢', title: 'Coworking', desc: 'Salas de foco ao vivo. Estude e trabalhe junto de outros Aprumados.', votes: 1103 },
  { id: 'nutricao', emoji: '🥗', title: 'Nutrição', desc: 'Expandir Saúde: alimentação, refeições, água e macros.', votes: 617 },
  { id: 'repertorio', emoji: '🧠', title: 'Repertório+', desc: 'Salvar artigos, vídeos, links e conteúdos externos.', votes: 589 },
  { id: 'circulos', emoji: '👥', title: 'Círculos+', desc: 'Desafios privados, metas coletivas, Kanban compartilhado e ranking.', votes: 690 },
]
export const seasonVotes = 3841

export interface CommunityState { likes: string[]; joined: string[]; vote: string | null; posts: FeedPost[] }
const KEY = 'aprumo-community'
const empty: CommunityState = { likes: [], joined: [], vote: null, posts: [] }

export function loadCommunity(): CommunityState {
  if (typeof window === 'undefined') return empty
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<CommunityState>) } : empty
  } catch { return empty }
}

export function saveCommunity(state: CommunityState) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore quota errors */ }
}
