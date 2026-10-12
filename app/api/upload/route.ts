import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload PNG, JPEG, or WEBP.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const baseName = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const outputFileName = `${baseName}.webp`;
    const outputPath = path.join(uploadsDir, outputFileName);

    let finalBuffer: Buffer = inputBuffer;
    let converted = false;

    // Use Sharp to convert any uploaded image (PNG, JPEG, etc.) into clean optimized WebP
    try {
      const sharp = require('sharp');
      finalBuffer = await sharp(inputBuffer)
        .webp({ quality: 88, effort: 4 })
        .toBuffer();
      converted = true;
    } catch (sharpErr) {
      console.warn('Sharp WebP conversion fallback, saving buffer directly:', sharpErr);
    }

    if (converted) {
      fs.writeFileSync(outputPath, finalBuffer);
      return NextResponse.json({
        success: true,
        url: `/uploads/${outputFileName}`,
        format: 'webp',
        size: finalBuffer.length
      });
    } else {
      // Fallback with original extension if sharp fails
      const ext = path.extname(file.name) || (file.type === 'image/png' ? '.png' : '.jpg');
      const fallbackName = `${baseName}${ext}`;
      const fallbackPath = path.join(uploadsDir, fallbackName);
      fs.writeFileSync(fallbackPath, inputBuffer);
      return NextResponse.json({
        success: true,
        url: `/uploads/${fallbackName}`,
        format: ext.replace('.', ''),
        size: inputBuffer.length
      });
    }
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
