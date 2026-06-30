import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login · Zelvo',
}

// Layout mínimo para a tela de login — sem sidebar, sem barra de usuário
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
