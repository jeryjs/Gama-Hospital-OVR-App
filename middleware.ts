export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/incidents/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};
