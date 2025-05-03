import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Конфигурация S3 клиента для SelectCloud
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-7',
  endpoint: process.env.S3_ENDPOINT || 'https://s3.ru-7.storage.selcloud.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

// Имя бакета/контейнера
const bucketName = process.env.S3_BUCKET_NAME || 'chinesestar';

/**
 * Загружает файл в S3 хранилище
 * @param fileBuffer - Буфер с содержимым файла
 * @param fileName - Имя файла в хранилище
 * @param contentType - MIME-тип файла
 * @param folder - Директория внутри бакета (без слеша в начале)
 * @returns Ключ загруженного объекта для дальнейшего использования
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'olympiad-media'
): Promise<string> {
  const key = folder ? `${folder}/${fileName}` : fileName;

  try {
    // Загрузка файла в S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    // Возвращаем ключ объекта
    return key;
  } catch (error) {
    console.error('[S3] Error uploading file:', error);
    throw new Error(
      `Failed to upload file to S3: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Создает подписанный URL для доступа к приватному S3 объекту
 * @param key - Ключ объекта в S3
 * @param expiresIn - Время жизни ссылки в секундах (3600 = 1 час)
 * @returns Подписанный URL для временного доступа
 */
export async function getSignedS3Url(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('[S3] Error generating signed URL:', error);
    throw new Error(
      `Failed to generate signed URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Удаляет файл из S3 хранилища
 * @param key - Полный путь к файлу в S3 (включая директорию)
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  } catch (error) {
    console.error('[S3] Error deleting file:', error);
    throw new Error(
      `Failed to delete file from S3: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
