'use client'

import { LoginHero }     from '@/components/login/LoginHero'
import { LoginFormCard } from '@/components/login/LoginFormCard'

export default function LoginPage() {
  return (
    <div
      id="login-scroll-container"
      className="w-full h-screen overflow-y-auto"
      style={{ background: '#1A1E23' }}
    >
      <LoginHero />
      <LoginFormCard />
    </div>
  )
}
