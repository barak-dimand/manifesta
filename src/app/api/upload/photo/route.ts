import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
];

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Photo storage not configured. Add BLOB_READ_WRITE_TOKEN to your environment.' },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Derive type from extension since pathname is the filename
        const ext = pathname.split('.').pop()?.toLowerCase() ?? '';
        const typeMap: Record<string, string> = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
          heic: 'image/heic', heif: 'image/heif', avif: 'image/avif',
          webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', tiff: 'image/tiff',
        };
        const detectedType = typeMap[ext];
        if (detectedType && !ALLOWED_TYPES.includes(detectedType)) {
          throw new Error('File type not allowed');
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB — enforced by Blob, not the function
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ folder: 'wizard-photos' }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // File is now in Blob storage — no further action needed here
        console.log('Photo uploaded to blob:', blob.pathname);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    );
  }
}
