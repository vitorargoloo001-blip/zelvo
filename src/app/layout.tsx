import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ZelvoMenu } from '@/components/ZelvoMenu'
import { StoreHydration } from '@/components/StoreHydration'
import { UserSwitcher } from '@/components/UserSwitcher'

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
        {/* Sidebar fixa — expande ao hover, sobrepõe o conteúdo */}
        <ZelvoMenu />

        {/* Conteúdo principal — ml-16 garante que não fica atrás da sidebar recolhida */}
        <main className="flex-1 overflow-auto ml-16 flex flex-col">
          <UserSwitcher />
          <div className="p-6 max-w-7xl mx-auto w-full flex-1">{children}</div>
        </main>
      </body>
    </html>
  )
}
