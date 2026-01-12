import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { isAdminInDB } from "@/lib/settingsDB";

const isDev = process.env.APP_ENV === 'development';

const clientId = isDev ? process.env.DEV_CLIENT_ID : process.env.DISCORD_CLIENT_ID;
const clientSecret = isDev ? process.env.DEV_DISCORD_CLIENT_SECRET : process.env.DISCORD_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: clientId!,
            clientSecret: clientSecret!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Allow only specific user ID (Bot Owner)
            // You can add more IDs to the array or check against an environment variable
            const MASTER_ADMIN = process.env.ADMIN_ID;

            if (user.id) {
                if (user.id === MASTER_ADMIN) return true;
                if (isAdminInDB(user.id)) return true;
            }

            console.log(`[Auth] Access denied for user: ${user.name} (${user.id})`);
            return false;
        },
        async session({ session, token }) {
            if (session?.user) {
                // Add ID to session user
                (session.user as any).id = token.sub;
            }
            return session;
        }
    },
    // pages: {
    //     signIn: '/', // Redirect to home if not signed in (for custom button)
    //     error: '/', // Redirect to home on error
    // },
    secret: process.env.NEXTAUTH_SECRET,
};
