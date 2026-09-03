import type { Metadata } from 'next'
import './globals.css'
import AppChrome from '@/components/layout/AppChrome'

export const metadata: Metadata = {
  title: 'GOATS — Sua evolução, todos os dias',
  description: 'Clareza para decidir. Sistema para executar. Evolução que você consegue ver.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><AppChrome>{children}</AppChrome></body></html>
}
