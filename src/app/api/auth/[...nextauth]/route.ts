import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// handler declaration removed

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;
