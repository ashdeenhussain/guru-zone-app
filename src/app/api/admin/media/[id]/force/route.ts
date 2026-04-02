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

        if (media.type === 'folder') {
            // Force delete folder: Delete all descendants permanently
            const descendants = await Media.find({ path: { $regex: `,${id},` } });

            for (const item of descendants) {
                if (item.type !== 'folder' && item.publicId) {
                    await cloudinary.uploader.destroy(item.publicId);
                }
            }

            await Media.deleteMany({ path: { $regex: `,${id},` } });
            await Media.findByIdAndDelete(id);
        } else {
            // Force delete file
            if (media.publicId) {
                await cloudinary.uploader.destroy(media.publicId);
            }
            await Media.findByIdAndDelete(id);
        }

        return NextResponse.json({ success: true, message: 'Permanently deleted' });
    } catch (error: any) {
        console.error('Force delete error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete permanently' }, { status: 500 });
    }
}
