import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Helper to detect file type from buffer using magic numbers
function detectFileType(buffer: Buffer): string | null {
    // PNG signature
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    // JPEG signature
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    // GIF signature
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return 'image/gif';
    }
    // WebP signature
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({
                success: false,
                error: 'No file uploaded'
            }, { status: 400 });
        }

        // Validation 1: File size check
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                success: false,
                error: 'File too large. Maximum size is 2MB'
            }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Validation 2: File type check using magic numbers (more reliable than MIME type)
        const detectedType = detectFileType(buffer);

        if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)'
            }, { status: 400 });
        }

        // Upload to Cloudinary with enhanced error handling
        try {
            const result = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'guru-zone/proofs',
                        resource_type: 'image',
                        timeout: 60000 // 60 second timeout
                    },
                    (error: any, result: any) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(buffer);
            });

            return NextResponse.json({ success: true, url: result.secure_url });
        } catch (cloudinaryError: any) {
            console.error('Cloudinary upload error:', cloudinaryError);

            // Provide user-friendly error messages based on error type
            if (cloudinaryError.http_code === 401 || cloudinaryError.http_code === 403) {
                return NextResponse.json({
                    success: false,
                    error: 'Upload service configuration error. Please contact support.'
                }, { status: 503 });
            }

            if (cloudinaryError.message?.includes('timeout') || cloudinaryError.code === 'ETIMEDOUT') {
                return NextResponse.json({
                    success: false,
                    error: 'Upload timeout. Please check your connection and try again.'
                }, { status: 504 });
            }

            if (cloudinaryError.http_code === 420) {
                return NextResponse.json({
                    success: false,
                    error: 'Upload service is temporarily overloaded. Please try again in a few minutes.'
                }, { status: 503 });
            }

            // Generic Cloudinary error
            return NextResponse.json({
                success: false,
                error: 'Upload service temporarily unavailable. Please try again later.'
            }, { status: 503 });
        }
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({
            success: false,
            error: 'An unexpected error occurred. Please try again.'
        }, { status: 500 });
    }
}
