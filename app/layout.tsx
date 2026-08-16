import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
export const metadata:Metadata={title:'GOATS — Sua evolução, todos os dias',description:'Tecnologia e humanos lado a lado na busca da sua melhor versão.'}
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body><div className="app-shell md:pl-[264px]"><Sidebar/><main>{children}</main></div><BottomNav/></body></html>}
