import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token }) => !!token,
    },
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (all API routes should return API errors, not HTML redirects)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (login page)
         * - signup (signup page)
         * - pricing (pricing page)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|login|signup|pricing).*)",
    ],
};
