'use client'

/**
 * Comunidade — escopo do MVP: Desafios, Círculos e Votação.
 *
 * As opções de votação abaixo são CONTEÚDO DE PRODUTO (o roadmap que a
 * comunidade decide), não dados fictícios de usuário. Já desafios, círculos e
 * contagens vêm do banco (tabelas challenges / circles / feature_votes) e por
 * isso não têm seed aqui — enquanto o backend não estiver conectado, a UI
 * mostra estado vazio em vez de números inventados.
 */

export interface VoteFeature { id: string; emoji: string; title: string; desc: string }

export const voteFeatures: VoteFeature[] = [
  { id: 'space', emoji: '💻', title: 'Aprumo Space', desc: 'Workspace para trabalho e estudo: Kanban, projetos, tarefas e sessões de foco.' },
  { id: 'coworking', emoji: '🟢', title: 'Coworking', desc: 'Salas de foco ao vivo. Estude e trabalhe junto de outras pessoas.' },
  { id: 'nutricao', emoji: '🥗', title: 'Nutrição', desc: 'Expandir Corpo: alimentação, refeições, água e acompanhamento.' },
  { id: 'repertorio', emoji: '🧠', title: 'Repertório+', desc: 'Salvar artigos, vídeos, links e conteúdos externos.' },
  { id: 'circulos', emoji: '👥', title: 'Círculos+', desc: 'Desafios privados, metas coletivas, ranking e sessões de foco em grupo.' },
]

/** Voto local, temporário. TODO: migrar para a tabela `feature_votes` + `feature_vote_counts()` quando o backend voltar. */
export interface CommunityState { vote: string | null }
const KEY = 'aprumo-community'
const empty: CommunityState = { vote: null }

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
