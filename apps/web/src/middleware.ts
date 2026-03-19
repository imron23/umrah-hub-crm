import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── PROTECTED ROUTES CONFIGURATION ───────────────────────────
// Middleware ini akan jalan di semua rute KECUALI yang diabaikan di config (images, css, js).
// Rute publik (tanpa login): /login, /lp/*, /promo/*

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Daftar prefix path yang dibolehkan diakses publik
  const isPublicPath = 
    pathname === '/login' || 
    pathname.startsWith('/lp') || 
    pathname.startsWith('/promo') || 
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  // Biarkan halaman public tembus
  if (isPublicPath) {
    // Jika user sudah punya token tapi mencoba buka halaman /login, tending dia ke dashboard (biar ngga ngulang login)
    if (pathname === '/login' && request.cookies.has('umrah_hub_jwt')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Cek JW Token di cookies browser pengguna
  const token = request.cookies.get('umrah_hub_jwt');

  // Jika tidak punya token atau dicoba akses halaman terproteksi (spt /, /analytics, dsb)
  if (!token) {
    // Lemparkan secara paksa ke halaman login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Token ada, lanjutkan akses ke halaman terproteksi
  return NextResponse.next();
}

// Konfigurasi ini memastikan middleware TIDAK berjalan di file aset statis agar loading web tetap super cepat
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, dll)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
