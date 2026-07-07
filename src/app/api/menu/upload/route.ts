import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check extension
    const name = file.name;
    const ext = name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc'].includes(ext)) {
      return NextResponse.json({ error: 'Only PDF or Word documents (.pdf, .docx, .doc) are allowed' }, { status: 400 });
    }

    // File name
    const timestamp = Date.now();
    const cleanFileName = `menu_${timestamp}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(cleanFileName, file, {
      access: 'public',
    });

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      name: file.name
    });
  } catch (error) {
    console.error('Error during file upload:', error);
    return NextResponse.json({ error: 'Internal server error during upload' }, { status: 500 });
  }
}
