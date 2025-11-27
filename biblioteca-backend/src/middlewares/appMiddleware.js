// src/middlewares/appMiddleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function appMiddleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname, searchParams } = request.nextUrl;

  // 🔴 CORREÇÃO: DETECTAR PEDIDO DE LOGOUT FORÇADO 🔴
  // Se a URL tiver ?forceLogout=true, apagamos o cookie e deixamos entrar no Login
  if (searchParams.get('forceLogout') === 'true') {
    const response = NextResponse.next();
    response.cookies.delete('token'); // Apaga o cookie Zumbi
    return response;
  }

  const publicRoutes = ['/login', '/cadastro', '/redefinir-senha', '/_next', '/static', '/siteFatec', '/favicon.ico'];

  // 1. Libera rotas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route)) || pathname === '/') {
    return NextResponse.next();
  }

  // 2. Bloqueia quem não tem token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const perfil = payload.perfil;

    // --- REGRAS DE PROTEÇÃO ---
    if (pathname.startsWith('/admin') && perfil !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (pathname.startsWith('/bibliotecario') && perfil !== 'bibliotecario') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // --- REGRAS DE REDIRECIONAMENTO ---
    if (pathname.startsWith('/dashboard') && perfil === 'bibliotecario') {
       return NextResponse.redirect(new URL('/bibliotecario/dashboard', request.url));
    }

    if (pathname.startsWith('/dashboard') && perfil === 'admin') {
       return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Se tentar ir pro Login estando logado -> Redireciona para Dashboard
    if (pathname === '/login') {
        if(perfil === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        if(perfil === 'bibliotecario') return NextResponse.redirect(new URL('/bibliotecario/dashboard', request.url));
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();

  } catch (error) {
    // Token inválido -> Login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}