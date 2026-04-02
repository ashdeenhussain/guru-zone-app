import { NextResponse } from 'next/server';
import Media from '@/models/Media';
import connectToDatabase from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const media = await Media.findById(id);
        if (!media) return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });

        media.isTrashed = false;
        media.trashedAt = null;
        await media.save();

        return NextResponse.json({ success: true, message: 'Restored successfully' });
    } catch (error: any) {
        console.error('Restore error:', error);
        return NextResponse.json({ success: false, error: 'Failed to restore' }, { status: 500 });
    }
}
