import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export async function GET(req: Request, props: any) {
    const params = await props.params;
    return handler(req, { params });
}

export async function POST(req: Request, props: any) {
    const params = await props.params;
    return handler(req, { params });
}
