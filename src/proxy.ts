import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth.js v5 usa um destes nomes de cookie dependendo do ambiente (HTTPS ou não).
// A verificação criptográfica do JWT acontece em auth() nas API routes (Node.js),
// não aqui: Edge runtime não tem o módulo `crypto` do Node.js.
// O proxy apenas redireciona para /login se o cookie de sessão estiver ausente.
const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']
const ROTAS_PUBLICAS  = ['/login', '/recuperar-senha', '/nova-senha']

export default function proxy(req: NextRequest) {
  const isCloudAuth = process.env.NEXT_PUBLIC_AUTH_MODE === 'cloud'
  if (!isCloudAuth) return NextResponse.next()

  const { pathname } = req.nextUrl
  if (ROTAS_PUBLICAS.some(r => pathname.startsWith(r))) return NextResponse.next()

  const hasSession = SESSION_COOKIES.some(name => req.cookies.has(name))
  if (!hasSession) return NextResponse.redirect(new URL('/login', req.nextUrl))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
