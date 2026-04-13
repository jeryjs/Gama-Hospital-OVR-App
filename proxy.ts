import { withAuth } from 'next-auth/middleware';

function isSharedTokenPath(pathname: string): boolean {
  return (/^\/incidents\/investigations\/[^/]+$/.test(pathname) || /^\/incidents\/corrective-actions\/[^/]+$/.test(pathname));
}

export default withAuth(
  function middleware() {
    return;
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        if (isSharedTokenPath(pathname) && req.nextUrl.searchParams.has('token')) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/incidents/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};
