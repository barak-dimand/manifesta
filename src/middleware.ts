import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/api/boards(.*)',
  '/api/user(.*)',
  '/api/email(.*)',
  '/api/wallpaper(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

// Only run Clerk on routes that actually need auth. Public pages skip the handshake.
// Excluding public pages (/, /create, /sign-in, /sign-up) prevents the
// cross-domain handshake redirect that Clerk dev instances do on non-localhost.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/(api|trpc)(.*)',
  ],
};
