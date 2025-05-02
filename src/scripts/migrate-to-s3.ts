/**
 * Скрипт для миграции медиафайлов олимпиад в S3 хранилище
 *
 * Запуск: npx ts-node src/scripts/migrate-to-s3.ts
 */

import fs from 'fs';
import path from 'path';
import { uploadToS3 } from '../lib/s3';
import { db } from '../lib/db';
import { olympiads, questions } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

// Директория с медиафайлами
const mediaSourceDirs = [
  path.join(process.cwd(), 'public', 'olympiad-media'),
  path.join(process.cwd(), 'public', 'static', 'olympiad-media'),
];

async function migrateFilesToS3() {
  console.log('🚀 Начинаем миграцию файлов в S3...');

  // Перебираем все директории с файлами
  for (const sourceDir of mediaSourceDirs) {
    if (!fs.existsSync(sourceDir)) {
      console.log(`Директория ${sourceDir} не существует, пропускаем`);
      continue;
    }

    console.log(`Обрабатываем директорию: ${sourceDir}`);

    // Получаем список файлов в директории
    const files = fs.readdirSync(sourceDir);
    console.log(`Найдено ${files.length} файлов`);

    // Мигрируем каждый файл
    for (const [index, fileName] of files.entries()) {
      try {
        // Пропускаем скрытые файлы и директории
        if (
          fileName.startsWith('.') ||
          fs.lstatSync(path.join(sourceDir, fileName)).isDirectory()
        ) {
          continue;
        }

        console.log(
          `[${index + 1}/${files.length}] Обработка файла: ${fileName}`
        );

        // Определяем MIME-тип по расширению
        const extension = path.extname(fileName).toLowerCase();
        let contentType = 'application/octet-stream'; // По умолчанию

        if (['.jpg', '.jpeg'].includes(extension)) contentType = 'image/jpeg';
        else if (extension === '.png') contentType = 'image/png';
        else if (extension === '.gif') contentType = 'image/gif';
        else if (extension === '.mp3') contentType = 'audio/mpeg';
        else if (extension === '.mp4') contentType = 'video/mp4';
        else if (extension === '.webm') contentType = 'video/webm';
        else if (extension === '.ogg') contentType = 'audio/ogg';
        else if (extension === '.wav') contentType = 'audio/wav';

        // Загружаем файл в S3
        const filePath = path.join(sourceDir, fileName);
        const fileContent = fs.readFileSync(filePath);

        const s3Url = await uploadToS3(
          fileContent,
          fileName,
          contentType,
          'olympiad-media'
        );

        console.log(`✅ Файл загружен в S3: ${s3Url}`);

        // Обновляем ссылки в базе данных
        await updateMediaUrlsInDatabase(`/olympiad-media/${fileName}`, s3Url);
        await updateMediaUrlsInDatabase(
          `/static/olympiad-media/${fileName}`,
          s3Url
        );
      } catch (error) {
        console.error(`❌ Ошибка при обработке файла ${fileName}:`, error);
      }
    }
  }

  console.log('✅ Миграция файлов завершена!');
}

/**
 * Обновляет URL медиафайлов в вопросах олимпиад
 */
async function updateMediaUrlsInDatabase(oldUrl: string, newUrl: string) {
  // Получаем все олимпиады
  const allOlympiads = await db.query.olympiads.findMany();

  console.log(`Проверяем ссылки в ${allOlympiads.length} олимпиадах...`);

  for (const olympiad of allOlympiads) {
    try {
      // Получаем вопросы олимпиады
      const olympiadQuestions = await db.query.questions.findMany({
        where: eq(questions.olympiadId, olympiad.id),
      });

      if (olympiadQuestions.length === 0) {
        continue;
      }

      // Проверяем каждый вопрос на наличие медиафайла
      for (const question of olympiadQuestions) {
        if (!question.content) continue;

        try {
          // Анализируем содержимое вопроса (обычно JSON)
          const content = JSON.parse(question.content);

          // Проверяем наличие медиа и URL
          if (content.media && content.media.url === oldUrl) {
            console.log(
              `Найдена ссылка для обновления в вопросе ${question.id}`
            );

            // Обновляем URL на новый из S3
            content.media.url = newUrl;

            // Сохраняем обновленное содержимое
            await db
              .update(questions)
              .set({ content: JSON.stringify(content) })
              .where(eq(questions.id, question.id));

            console.log(`✅ Вопрос ${question.id} обновлен с новым URL`);
          }
        } catch (parseError) {
          console.error(
            `Ошибка при анализе содержимого вопроса ${question.id}:`,
            parseError
          );
        }
      }
    } catch (olympiadError) {
      console.error(
        `Ошибка при обработке олимпиады ${olympiad.id}:`,
        olympiadError
      );
    }
  }
}

// Запускаем миграцию
migrateFilesToS3().catch((error) => {
  console.error('❌ Ошибка при миграции файлов:', error);
  process.exit(1);
});
