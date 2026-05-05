import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filename = `wizard-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const blob = await put(filename, file, { access: 'public' });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Blob upload failed:', detail);
    return NextResponse.json({ error: 'Upload failed', detail }, { status: 500 });
  }
}
