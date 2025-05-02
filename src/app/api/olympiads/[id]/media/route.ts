import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { olympiads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { uploadToS3 } from '@/lib/s3';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[media/route] Starting file upload for olympiad ${params.id}`);

  try {
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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Загружаем файл в S3 вместо локальной файловой системы
    console.log(`[media/route] Uploading file to S3: ${uniqueFilename}`);
    try {
      const fileUrl = await uploadToS3(
        buffer,
        uniqueFilename,
        file.type,
        'olympiad-media'
      );

      console.log(`[media/route] File uploaded to S3 successfully: ${fileUrl}`);

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
      console.log(`[media/route] Generated file URL: ${fileUrl}`);
      return NextResponse.json({
        url: fileUrl,
        type: mediaType,
      });
    } catch (uploadError) {
      console.error('[media/route] Error uploading file to S3:', uploadError);
      return NextResponse.json(
        { message: 'Failed to upload file to S3' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[media/route] Error processing upload:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
