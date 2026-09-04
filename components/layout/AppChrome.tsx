'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

const publicRoutes = new Set(['/', '/login', '/cadastro', '/recuperar-senha', '/nova-senha', '/onboarding'])

export default function AppChrome({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = () => document.documentElement.dataset.theme = localStorage.getItem('aprumo-theme') ?? 'dark'
    applyTheme()
    window.addEventListener('aprumo-theme-change', applyTheme)
    return () => window.removeEventListener('aprumo-theme-change', applyTheme)
  }, [])
  const isPublic = publicRoutes.has(usePathname())
  if (isPublic) return <>{children}</>
  return <div className="app-shell md:pl-[264px]"><Sidebar/><main><TopBar/>{children}</main><BottomNav/></div>
}
