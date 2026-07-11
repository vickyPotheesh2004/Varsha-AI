import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateOrigin, getCookie } from '@/lib/security';
import { verifyAndIncrement } from '@/lib/rate-limit';

// Allowed MIME types
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
// Max file size: 2MB in bytes
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // 1. Origin verification to prevent CSRF
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden: Request origin is not allowed' }, { status: 403 });
    }

    // 2. Stateless rate-limiting for file uploads (max 3 uploads per minute per IP)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const currentToken = getCookie(request, 'varsha-rl-upload');

    const { allowed, newToken } = verifyAndIncrement(ip, currentToken, 3, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please wait a minute before uploading another photo.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { fileName, fileType, fileData } = body; // fileData is base64 string

    if (!fileName || !fileType || !fileData) {
      return NextResponse.json({ error: 'Missing required file fields' }, { status: 400 });
    }

    // 3. Strict MIME type validation
    if (!ALLOWED_MIMES.includes(fileType)) {
      return NextResponse.json({ error: `Invalid file type. Allowed types: ${ALLOWED_MIMES.join(', ')}` }, { status: 400 });
    }

    // 4. Calculate file size from base64 string length
    const approxSizeBytes = Math.floor((fileData.length * 3) / 4);
    if (approxSizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File size exceeds the 2MB limit' }, { status: 400 });
    }

    let publicUrl = '';

    if (supabase) {
      try {
        // Convert base64 back into a binary buffer
        const buffer = Buffer.from(fileData, 'base64');
        const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        // Upload to Supabase Storage bucket 'report-photos'
        const { data, error } = await supabase.storage
          .from('report-photos')
          .upload(uniqueFileName, buffer, {
            contentType: fileType,
            upsert: true
          });

        if (error) throw error;

        // Retrieve public access URL
        const { data: urlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(uniqueFileName);
        
        publicUrl = urlData.publicUrl;
      } catch (err: any) {
        console.error('Supabase Storage upload failed, falling back to data URI:', err);
        // Fall back to base64 data URI if bucket or permission is misconfigured
        publicUrl = `data:${fileType};base64,${fileData}`;
      }
    } else {
      // Local fallback: return a browser-renderable Base64 data URI
      publicUrl = `data:${fileType};base64,${fileData}`;
    }

    const response = NextResponse.json({ success: true, url: publicUrl });
    response.headers.set(
      'Set-Cookie',
      `varsha-rl-upload=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=60`
    );
    return response;
  } catch (error: any) {
    console.error('File upload failed:', error);
    return NextResponse.json({ error: 'Upload failed', message: error.message }, { status: 500 });
  }
}
