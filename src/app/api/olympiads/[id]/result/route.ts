import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { participantResults, olympiads } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';
import { getSignedS3Url } from '@/lib/s3';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the result with olympiad details
    const results = await db
      .select({
        result: participantResults,
        olympiad: olympiads,
      })
      .from(participantResults)
      .innerJoin(olympiads, eq(participantResults.olympiadId, olympiads.id))
      .where(
        and(
          eq(participantResults.userId, userId),
          eq(participantResults.olympiadId, params.id)
        )
      )
      .limit(1);

    if (!results.length) {
      return NextResponse.json(
        { message: 'Result not found' },
        { status: 404 }
      );
    }

    const { result, olympiad } = results[0];

    // Проверяем, если у результата есть certificateUrl и он содержит ключ объекта S3
    let certificatePresignedUrl = null;
    if (result.certificateUrl) {
      try {
        // Получаем ключ из URL (обычно '/certificates/имя_файла.pdf')
        const certificateKey = result.certificateUrl
          .split('/')
          .slice(-2)
          .join('/');
        if (certificateKey.includes('/')) {
          // Генерируем presigned URL для доступа к сертификату
          certificatePresignedUrl = await getSignedS3Url(
            certificateKey,
            24 * 60 * 60
          );
        } else {
          // Если не удалось получить ключ, используем прямой URL
          certificatePresignedUrl = result.certificateUrl;
        }
      } catch (error) {
        console.error('Error generating presigned URL for certificate:', error);
        // Если не удалось сгенерировать presigned URL, используем прямой URL
        certificatePresignedUrl = result.certificateUrl;
      }
    }

    return NextResponse.json({
      id: result.id,
      score: result.score,
      completedAt: result.completedAt,
      place: result.place,
      certificateUrl: certificatePresignedUrl,
      olympiad: {
        title: olympiad.title,
        level: olympiad.level,
      },
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
