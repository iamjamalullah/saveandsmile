import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true'
  };
}

export async function OPTIONS(req: NextRequest): Promise<Response> {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(req)
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const authHeader = req.headers.get('authorization') || '';
    // Optional Bearer validation: if token present, verify with jwt
    if (authHeader.startsWith('Bearer ')) {
      const { verifyAuthToken } = require('@/lib/api/auth');
      const user = verifyAuthToken({ headers: { authorization: authHeader } });
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401, headers: corsHeaders });
      }
    }

    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('image')) as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400, headers: corsHeaders });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload PNG, JPEG, or WEBP.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const baseName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outputFileName = `${baseName}.webp`;
    const outputPath = path.join(uploadsDir, outputFileName);

    let finalBuffer: Buffer = inputBuffer;
    let converted = false;

    // Use Sharp to convert image to WebP
    try {
      const sharp = require('sharp');
      finalBuffer = await sharp(inputBuffer)
        .webp({ quality: 88, effort: 4 })
        .toBuffer();
      converted = true;
    } catch (sharpErr) {
      console.warn('Sharp WebP conversion fallback, saving buffer directly:', sharpErr);
    }

    try {
      if (converted) {
        fs.writeFileSync(outputPath, finalBuffer);
        return NextResponse.json({
          success: true,
          url: `/uploads/${outputFileName}`,
          format: 'webp',
          size: finalBuffer.length
        }, { headers: corsHeaders });
      } else {
        const ext = path.extname(file.name) || (file.type === 'image/png' ? '.png' : '.jpg');
        const fallbackName = `${baseName}${ext}`;
        const fallbackPath = path.join(uploadsDir, fallbackName);
        fs.writeFileSync(fallbackPath, inputBuffer);
        return NextResponse.json({
          success: true,
          url: `/uploads/${fallbackName}`,
          format: ext.replace('.', ''),
          size: inputBuffer.length
        }, { headers: corsHeaders });
      }
    } catch (fsWriteErr: any) {
      console.warn('Filesystem write failed (likely serverless read-only), returning Data URL:', fsWriteErr.message);
      const mime = converted ? 'image/webp' : (file.type || 'image/jpeg');
      const b64 = (converted ? finalBuffer : inputBuffer).toString('base64');
      return NextResponse.json({
        success: true,
        url: `data:${mime};base64,${b64}`,
        format: mime,
        size: inputBuffer.length,
        isDataUrl: true
      }, { headers: corsHeaders });
    }
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const media: any[] = [];

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        try {
          const stat = fs.statSync(path.join(uploadsDir, f));
          if (stat.isFile()) {
            media.push({
              name: f,
              url: `/uploads/${f}`,
              size: stat.size,
              updatedAt: stat.mtime.toISOString()
            });
          }
        } catch (e) {}
      }
    }

    // Also include logo and banner assets if present
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    if (fs.existsSync(imagesDir)) {
      const imgFiles = fs.readdirSync(imagesDir);
      for (const f of imgFiles) {
        try {
          const stat = fs.statSync(path.join(imagesDir, f));
          if (stat.isFile()) {
            media.push({
              name: f,
              url: `/images/${f}`,
              size: stat.size,
              updatedAt: stat.mtime.toISOString()
            });
          }
        } catch (e) {}
      }
    }

    media.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ success: true, count: media.length, media }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const body = await req.json().catch(() => ({}));
    const fileName = body.name || req.nextUrl.searchParams.get('name');

    if (!fileName) {
      return NextResponse.json({ success: false, error: 'File name is required' }, { status: 400, headers: corsHeaders });
    }

    const safeName = path.basename(fileName);
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: 'File deleted successfully' }, { headers: corsHeaders });
    }

    return NextResponse.json({ success: false, error: 'File not found' }, { status: 404, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

