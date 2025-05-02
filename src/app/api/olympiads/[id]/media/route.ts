import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { olympiads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// Create uploads directory if it doesn't exist
const mediaDir = path.join(process.cwd(), 'public', 'olympiad-media');

// Вспомогательная функция для проверки и создания директории
async function ensureDirectoryExists(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`[media/route] Creating directory: ${dirPath}`);
      await mkdir(dirPath, { recursive: true });
      console.log(`[media/route] Directory created: ${dirPath}`);
    } else {
      console.log(`[media/route] Directory already exists: ${dirPath}`);
    }

    // Проверка прав доступа
    try {
      const testFile = path.join(dirPath, `.test-${Date.now()}.tmp`);
      await writeFile(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`[media/route] Directory is writable: ${dirPath}`);
    } catch (error) {
      console.error(
        `[media/route] Directory is NOT writable: ${dirPath}`,
        error
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[media/route] Error creating directory: ${dirPath}`, error);
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[media/route] Starting file upload for olympiad ${params.id}`);

  try {
    // Ensure media directory exists
    const dirExists = await ensureDirectoryExists(mediaDir);
    if (!dirExists) {
      return NextResponse.json(
        { message: 'Failed to create media directory' },
        { status: 500 }
      );
    }

    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify olympiad ownership
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    if (!olympiad) {
      return NextResponse.json(
        { message: 'Olympiad not found' },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(
      `[media/route] Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`
    );

    // Validate file type
    const fileType = file.type;
    if (!fileType.match(/^(image|video|audio)\//)) {
      return NextResponse.json(
        { message: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${createId()}.${fileExtension}`;
    const filePath = path.join(mediaDir, uniqueFilename);

    // Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[media/route] Saving file to: ${filePath}`);
    try {
      await writeFile(filePath, buffer);
      console.log(`[media/route] File saved successfully to: ${filePath}`);

      // Verify file exists after saving
      if (!fs.existsSync(filePath)) {
        console.error(`[media/route] File was not saved properly: ${filePath}`);
        return NextResponse.json(
          { message: 'Failed to save file' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error(`[media/route] Error saving file: ${filePath}`, error);
      return NextResponse.json(
        { message: 'Failed to save file' },
        { status: 500 }
      );
    }

    // Determine media type
    let mediaType: 'image' | 'video' | 'audio';
    if (fileType.startsWith('image/')) {
      mediaType = 'image';
    } else if (fileType.startsWith('video/')) {
      mediaType = 'video';
    } else if (fileType.startsWith('audio/')) {
      mediaType = 'audio';
    } else {
      // This shouldn't happen due to earlier validation, but just in case
      return NextResponse.json(
        { message: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Return the file URL and type
    const fileUrl = `/olympiad-media/${uniqueFilename}`;
    console.log(`[media/route] Generated file URL: ${fileUrl}`);
    return NextResponse.json({
      url: fileUrl,
      type: mediaType,
    });
  } catch (error) {
    console.error('[media/route] Error uploading file:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
