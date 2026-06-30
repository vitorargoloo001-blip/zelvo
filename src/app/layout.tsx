import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { StoreHydration } from '@/components/StoreHydration'
import { AppShell }       from '@/components/AppShell'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zelvo — O lead certo no corretor certo.',
  description: 'Sistema inteligente de qualificação, ranking e distribuição de leads.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`}>
      <body className="h-full flex antialiased" style={{ background: '#1A1E23' }}>
        <StoreHydration />
        {/*
          AppShell detecta a rota client-side:
          - /login, /recuperar-senha → sem sidebar, sem barra de usuário
          - demais rotas             → ZelvoMenu + UserBar (mock ou supabase)
        */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
