'use client'

import { useEffect, useState } from 'react'

export type Plan = 'free' | 'plus'

export interface PlanState {
  plan: Plan
  balance: number
  checkoutUrl: string | null
  checkoutEmail: string | null
  loading: boolean
}

/**
 * Goats+ é baseado em créditos (Cakto). Não existe uma flag booleana de
 * assinatura no perfil, então tratamos um saldo de créditos positivo como
 * acesso Goats+ ativo — o melhor sinal disponível hoje. Degrada para 'free'
 * quando offline ou sem backend.
 */
export function usePlan(): PlanState {
  const [state, setState] = useState<PlanState>({ plan: 'free', balance: 0, checkoutUrl: null, checkoutEmail: null, loading: true })
  useEffect(() => {
    let active = true
    fetch('/api/billing', { cache: 'no-store' })
      .then(response => (response.ok ? response.json() : null))
      .then((data: { balance?: number; checkoutUrl?: string | null; checkoutEmail?: string | null } | null) => {
        if (!active) return
        if (!data) { setState(previous => ({ ...previous, loading: false })); return }
        const balance = Number(data.balance ?? 0)
        setState({ plan: balance > 0 ? 'plus' : 'free', balance, checkoutUrl: data.checkoutUrl ?? null, checkoutEmail: data.checkoutEmail ?? null, loading: false })
      })
      .catch(() => { if (active) setState(previous => ({ ...previous, loading: false })) })
    return () => { active = false }
  }, [])
  return state
}
