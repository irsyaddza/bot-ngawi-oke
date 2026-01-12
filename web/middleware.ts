import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Verified by NextAuth that token exists
        // You can add extra checks here if needed, 
        // but auth.ts signIn callback already handles the ID whitelist check.
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/api/auth/signin", // Redirect here if not authorized
        },
    }
);

// Protect only /admin routes
export const config = { matcher: ["/admin/:path*"] };
