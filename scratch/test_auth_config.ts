import { authOptions } from './src/lib/auth';
import NextAuth from 'next-auth';

console.log('Auth Options:', JSON.stringify(authOptions, null, 2));

try {
    const handler = NextAuth(authOptions);
    console.log('NextAuth handler initialized successfully');
} catch (e: any) {
    console.error('Failed to initialize NextAuth handler:', e.message);
}
