
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import Media from '@/models/Media';
import connectToDatabase from '@/lib/db'; // Correct import

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Helper to detect file type from buffer
function detectFileType(buffer: Buffer): string | null {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
    return null;
}

export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const parentId = searchParams.get('parentId') || null;
        const view = searchParams.get('view');

        console.log('GET Media - Params:', { parentId, view });

        const query: any = {};

        if (view === 'trash') {
            query.isTrashed = true;
        } else {
            query.isTrashed = false;
            // Handle "null" string vs null value
            if (parentId === 'null' || parentId === '') {
                query.parent = null;
            } else {
                query.parent = parentId;
            }
        }

        console.log('GET Media - Mongo Query:', JSON.stringify(query));

        const media = await Media.find(query).sort({ type: 1, createdAt: -1 });
        console.log(`GET Media - Found ${media.length} items`);

        return NextResponse.json({ success: true, media });
    } catch (error: any) {
        console.error('Error fetching media:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch media' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();

        // check content type to distinguish between file upload (multipart) and folder creation (json)
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            // Folder Creation
            const body = await req.json();
            const { name, parent } = body;

            if (!name) return NextResponse.json({ success: false, error: 'Folder name required' }, { status: 400 });

            // Construct path
            let path = ',';
            if (parent) {
                const parentFolder = await Media.findById(parent);
                if (parentFolder) {
                    path = parentFolder.path + parent + ',';
                }
            }

            const newFolder = await Media.create({
                type: 'folder',
                fileName: name,
                parent: parent || null,
                path,
                // defaults for others
            });

            return NextResponse.json({ success: true, media: newFolder });
        } else {
            // File Upload
            const data = await req.formData();
            const file: File | null = data.get('file') as unknown as File;
            const parentId = data.get('parentId') as string | null;

            if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });

            if (file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, error: 'File too large (Max 5MB)' }, { status: 400 });

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const detectedType = detectFileType(buffer);

            if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType)) {
                return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
            }

            // Construct path for file
            let path = ',';
            if (parentId) {
                const parentFolder = await Media.findById(parentId);
                if (parentFolder) {
                    path = parentFolder.path + parentId + ',';
                }
            }

            // Upload to Cloudinary
            const result: any = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'guru-zone/media-library', resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary Upload Error:', error);
                            reject(error);
                        }
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            console.log('Cloudinary Upload Success:', result.secure_url);

            // Save to DB
            const newMedia = await Media.create({
                type: 'image',
                url: result.secure_url,
                publicId: result.public_id,
                fileName: file.name,
                mimeType: detectedType,
                size: file.size,
                parent: parentId || null,
                path
            });

            console.log('DB Save Success:', newMedia._id);

            return NextResponse.json({ success: true, media: newMedia });
        }
    } catch (error: any) {
        console.error('Upload error (Catch Block):', error);
        return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 500 });
    }
}
