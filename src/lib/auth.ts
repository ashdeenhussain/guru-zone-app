import { AuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/clientPromise';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Add Permissions Type (matches enum in models/User.ts)
export type AdminPermission =
    | 'manage_finance'
    | 'manage_tournaments'
    | 'manage_store'
    | 'manage_support'
    | 'manage_system';

export function hasPermission(
    session: Session | null, 
    permission: AdminPermission | null
): session is Session & { user: { id: string; name: string; role: string; permissions: string[] } } {
    if (!session?.user) return false;
    if (session.user.role !== 'admin') return false;

    const permissions = session.user.permissions || [];

    // Super Admins have manage_system permission which grants access to everything
    if (permissions.includes('manage_system')) return true;

    // If permission is null, only 'admin' role check is needed
    if (!permission) return true;

    // Otherwise check for the specific permission
    return permissions.includes(permission);
}

export const authOptions: AuthOptions = {
    debug: true,
    // adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error('Please enter an email and password');
                    }

                    await connectToDatabase();

                    const user = await User.findOne({ email: credentials.email }).select('+password');

                    if (!user) {
                        throw new Error('No user found with this email');
                    }

                    if (!user.password) {
                        throw new Error('Please sign in with your Google account');
                    }

                    // Check if user is banned
                    if (user.status === 'banned') {
                        throw new Error(user.banReason ? `Account Banned: ${user.banReason}` : 'Account Banned');
                    }

                    const isPasswordCorrect = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordCorrect) {
                        throw new Error('Invalid credentials');
                    }

                    // Return a plain object to ensure NextAuth handles it correctly
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions || [],
                        trustScore: user.trustScore,
                        status: user.status,
                        banReason: user.banReason,
                    };
                } catch (error: any) {
                    console.error('NextAuth Authorize Error:', error.message);
                    throw error;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user }) {
            try {
                const userId = user.id || (user as any)._id;
                if (!userId) return true;

                await connectToDatabase();
                await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
                return true;
            } catch (error) {
                console.error("Error updating lastLogin", error);
                return true;
            }
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.permissions = user.permissions; // Add permissions to token
                token.trustScore = user.trustScore;
                token.status = user.status;
                token.banReason = user.banReason;
            }
            if (trigger === "update" && session?.name) {
                token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.permissions = token.permissions; // Pass permissions to session
                session.user.trustScore = token.trustScore;
                session.user.status = token.status;
                session.user.banReason = token.banReason;
            }
            return session;
        }
    }
};
