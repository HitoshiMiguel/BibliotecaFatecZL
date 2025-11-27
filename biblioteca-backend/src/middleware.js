// src/middleware.js

// Importa a lógica da sua pasta organizada
import { appMiddleware } from './middlewares/appMiddleware';

// O Next.js chama esta função automaticamente
export function middleware(request) {
  return appMiddleware(request);
}

// A configuração também deve ser exportada daqui
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};