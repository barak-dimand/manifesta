import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import sharp from 'sharp';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Formats that need conversion to JPEG for Replicate compatibility
const NEEDS_CONVERSION = new Set([
  'image/heic',
  'image/heif',
  'image/avif',
  'image/tiff',
  'image/bmp',
  'image/x-bmp',
  'image/gif',
  'image/webp',
]);

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Photo storage not configured. Add BLOB_READ_WRITE_TOKEN to your environment.' },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    let uploadBuffer: Buffer;
    let filename: string;
    let contentType: string;

    if (NEEDS_CONVERSION.has(file.type) || file.name.toLowerCase().match(/\.(heic|heif|avif|tiff?|bmp|gif|webp)$/)) {
      // Convert to JPEG for universal compatibility (Replicate, browsers, display)
      uploadBuffer = await sharp(inputBuffer).rotate().jpeg({ quality: 90 }).toBuffer();
      filename = `wizard-photos/${uniqueId}.jpg`;
      contentType = 'image/jpeg';
    } else {
      // JPEG and PNG pass through — already Replicate-compatible
      uploadBuffer = inputBuffer;
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      filename = `wizard-photos/${uniqueId}.${ext}`;
      contentType = file.type || 'image/jpeg';
    }

    const blob = await put(filename, uploadBuffer, { access: 'public', contentType });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Blob upload failed:', detail);
    return NextResponse.json({ error: 'Upload failed', detail }, { status: 500 });
  }
}
