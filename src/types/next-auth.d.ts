import { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's unique identifier. */
            id: string
            /** The user's role. */
            role?: string
            permissions?: string[]
        } & DefaultSession["user"]
    }

    interface User {
        role?: string
        permissions?: string[]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role?: string
        permissions?: string[]
    }
}
