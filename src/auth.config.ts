import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login', // Generic login page
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnEmployee = nextUrl.pathname.startsWith('/employee');
            const isOnLogin = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/admin/login');

            // 1. Protection for Admin Routes
            if (isOnAdmin) {
                // Allow access to admin login page itself
                if (nextUrl.pathname === '/admin/login') return true;

                if (isLoggedIn) {
                    // Check Role
                    // @ts-ignore
                    if (auth.user.role === 'admin') return true;
                    return false; // Redirect unprivileged users
                }
                return false; // Redirect unauthenticated users to login
            }

            // 2. Protection for Employee Routes
            if (isOnEmployee) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated to login
            }

            // 3. Redirect logged-in users away from login pages
            if (isOnLogin && isLoggedIn) {
                // @ts-ignore 
                if (auth.user.role === 'admin') {
                    return Response.redirect(new URL('/admin', nextUrl));
                } else {
                    return Response.redirect(new URL('/employee', nextUrl));
                }
            }

            return true;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                session.user.farmId = token.farmId as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.farmId = user.farmId;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
