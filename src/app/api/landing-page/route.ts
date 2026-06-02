import { NextResponse } from 'next/server';
import { getLandingPageContent } from '@/lib/landing';

export async function GET() {
    try {
        const content = await getLandingPageContent();
        return NextResponse.json(content);
    } catch (error) {
        console.error("Error fetching landing page content:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

