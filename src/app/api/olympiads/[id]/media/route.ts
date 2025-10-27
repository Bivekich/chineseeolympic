import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { olympiads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { uploadToS3, getSignedS3Url } from '@/lib/s3';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[media/route] Starting file upload for olympiad ${id}`);

    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify olympiad ownership
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, id),
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

    // Загружаем файл в S3
    console.log(`[media/route] Uploading file to S3: ${uniqueFilename}`);
    try {
      const objectKey = await uploadToS3(
        buffer,
        uniqueFilename,
        file.type,
        'olympiad-media'
      );

      // Генерируем presigned URL для доступа к объекту (срок жизни ссылки - 24 часа)
      const presignedUrl = await getSignedS3Url(objectKey, 24 * 60 * 60);

      console.log(
        `[media/route] File uploaded to S3 successfully, presigned URL generated: ${presignedUrl}`
      );

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
      console.log(`[media/route] Generated presigned URL: ${presignedUrl}`);
      return NextResponse.json({
        url: presignedUrl,
        type: mediaType,
        key: objectKey, // Добавляем ключ объекта для будущего получения новых presigned URL
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

// Новый endpoint для обновления presigned URL для объекта
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Await params even though we don't use id in this endpoint
    // Проверка авторизации
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Получаем ключ объекта из URL параметров
    const url = new URL(request.url);
    const objectKey = url.searchParams.get('key');

    if (!objectKey) {
      return NextResponse.json(
        { message: 'Object key is required' },
        { status: 400 }
      );
    }

    // Генерируем новый presigned URL
    const presignedUrl = await getSignedS3Url(objectKey, 24 * 60 * 60);

    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    console.error('[media/route] Error generating presigned URL:', error);
    return NextResponse.json(
      { message: 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}
