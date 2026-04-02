
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import Media from '@/models/Media';
import connectToDatabase from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const media = await Media.findById(id);
        if (!media) return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });

        // Soft Delete: Mark as trashed
        media.isTrashed = true;
        media.trashedAt = new Date();
        await media.save();

        return NextResponse.json({ success: true, message: 'Moved to trash' });
    } catch (error: any) {
        console.error('Soft delete error:', error);
        return NextResponse.json({ success: false, error: 'Failed to move to trash' }, { status: 500 });
    }
}
