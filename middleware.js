import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Инициализируем клиент Supabase для Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()

  // ПРОВЕРКА: Если пользователя нет и он пытается зайти в Dashboard
  // Добавь сюда все пути, которые хочешь защитить
  const protectedPaths = ['/dashboard', '/profile'] 
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('https://landing-page-volunteer.vercel.app/login', req.url))
  }

  return res
}

// Настройка: какие пути должен обрабатывать Middleware
export const config = {
  matcher: [
    /*
     * Обрабатывать все пути, кроме:
     * - _next/static (статические файлы)
     * - _next/image (оптимизированные изображения)
     * - favicon.ico (иконка)
     * - public (папка public)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}