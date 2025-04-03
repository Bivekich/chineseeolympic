import PDFDocument from 'pdfkit';
import { createId } from '@paralleldrive/cuid2';
import fs from 'fs';
import path from 'path';

interface GenerateCertificateParams {
  userName: string;
  olympiadTitle: string;
  place?: string;
}

// Новый тип диплома с различными вариантами для победителей и участников
export enum DiplomaType {
  FIRST_PLACE = 'first_place',
  SECOND_PLACE = 'second_place',
  THIRD_PLACE = 'third_place',
  PARTICIPANT = 'participant',
}

export async function generateCertificate({
  userName,
  olympiadTitle,
  place,
}: GenerateCertificateParams): Promise<string> {
  // Определяем тип диплома на основе места
  const diplomaType = getDiplomaType(place);

  // Используем обновленную функцию для создания диплома
  return generateDiploma({
    userName,
    olympiadTitle,
    place,
    diplomaType,
  });
}

function getDiplomaType(place?: string): DiplomaType {
  if (!place) return DiplomaType.PARTICIPANT;

  switch (place) {
    case '1':
      return DiplomaType.FIRST_PLACE;
    case '2':
      return DiplomaType.SECOND_PLACE;
    case '3':
      return DiplomaType.THIRD_PLACE;
    default:
      return DiplomaType.PARTICIPANT;
  }
}

interface GenerateDiplomaParams extends GenerateCertificateParams {
  diplomaType: DiplomaType;
}

async function generateDiploma({
  userName,
  olympiadTitle,
  place,
  diplomaType,
}: GenerateDiplomaParams): Promise<string> {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
  });

  // Create certificates directory if it doesn't exist
  const certificatesDir = path.join(process.cwd(), 'public', 'certificates');
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  // Generate certificate file path
  const certificateId = createId();
  const fileName = `${certificateId}.pdf`;
  const filePath = path.join(certificatesDir, fileName);
  const writeStream = fs.createWriteStream(filePath);

  // Pipe the PDF to the file
  doc.pipe(writeStream);

  // Добавляем фон в стиле сайта
  addBackground(doc, diplomaType);

  // Добавляем содержимое по типу диплома
  switch (diplomaType) {
    case DiplomaType.FIRST_PLACE:
      addFirstPlaceDiploma(doc, userName, olympiadTitle);
      break;
    case DiplomaType.SECOND_PLACE:
      addSecondPlaceDiploma(doc, userName, olympiadTitle);
      break;
    case DiplomaType.THIRD_PLACE:
      addThirdPlaceDiploma(doc, userName, olympiadTitle);
      break;
    default:
      addParticipantDiploma(doc, userName, olympiadTitle);
      break;
  }

  // Добавляем дату и подпись
  addDateAndSignature(doc);

  // Finalize the PDF
  doc.end();

  // Wait for the file to be written
  await new Promise<void>((resolve) => writeStream.on('finish', resolve));

  // Return the URL
  return `/certificates/${fileName}`;
}

function addBackground(doc: PDFKit.PDFDocument, diplomaType: DiplomaType) {
  // Создаем градиентный фон в стиле сайта
  const width = doc.page.width;
  const height = doc.page.height;

  // Основной градиент фона
  const gradient = doc.linearGradient(0, 0, width, height);

  // Используем цвета из globals.css
  gradient.stop(0, '#7f1d1d'); // --background-start-rgb
  gradient.stop(1, '#991b1b'); // --background-end-rgb

  doc.rect(0, 0, width, height);
  doc.fill(gradient);

  // Добавляем полупрозрачный узор
  doc.save();
  doc.fill('white');
  doc.opacity(0.05);

  // Простой декоративный узор
  const patternSize = 30;
  for (let x = 0; x < width; x += patternSize) {
    for (let y = 0; y < height; y += patternSize) {
      if ((x + y) % (patternSize * 2) === 0) {
        doc.circle(x, y, 5).fill();
      }
    }
  }

  doc.restore();

  // Декоративная рамка для диплома
  doc.save();
  doc.strokeColor('white');
  doc.opacity(0.3);
  doc.lineWidth(10);
  doc.roundedRect(30, 30, width - 60, height - 60, 10);
  doc.stroke();
  doc.restore();

  // Для победителей добавляем дополнительные элементы
  if (diplomaType !== DiplomaType.PARTICIPANT) {
    doc.save();
    doc.fill('white');
    doc.opacity(0.2);

    // Угловые декоративные элементы для победителей
    const cornerSize = 80;
    // Верхний левый угол
    doc.circle(30, 30, cornerSize / 2).fill();
    // Верхний правый угол
    doc.circle(width - 30, 30, cornerSize / 2).fill();
    // Нижний левый угол
    doc.circle(30, height - 30, cornerSize / 2).fill();
    // Нижний правый угол
    doc.circle(width - 30, height - 30, cornerSize / 2).fill();

    doc.restore();
  }
}

function addFirstPlaceDiploma(
  doc: PDFKit.PDFDocument,
  userName: string,
  olympiadTitle: string
) {
  // Заголовок диплома
  doc.save();
  doc.fill('white');
  doc.fontSize(60);
  doc.font('Helvetica-Bold');
  doc.text('ДИПЛОМ', { align: 'center' });
  doc.fontSize(40);
  doc.text('I СТЕПЕНИ', { align: 'center' });

  // Золотая печать для 1-го места
  doc.save();
  doc.fill('#FFD700');
  doc.circle(doc.page.width / 2, 220, 30);
  doc.fill();

  doc.fill('#7f1d1d');
  doc.fontSize(16);
  doc.font('Helvetica-Bold');
  doc.text('1', doc.page.width / 2 - 5, 215);
  doc.restore();

  // Текст диплома
  doc.moveDown(3);
  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('Награждается', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(35);
  doc.font('Helvetica-Bold');
  doc.text(userName, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('занявший(ая) I место в олимпиаде', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(30);
  doc.font('Helvetica-Bold');
  doc.text(`"${olympiadTitle}"`, { align: 'center' });

  // Китайский символ
  doc.save();
  doc.fill('white');
  doc.opacity(0.1);
  doc.fontSize(150);
  doc.text('汉语', { align: 'center' });
  doc.restore();
}

function addSecondPlaceDiploma(
  doc: PDFKit.PDFDocument,
  userName: string,
  olympiadTitle: string
) {
  // Заголовок диплома
  doc.save();
  doc.fill('white');
  doc.fontSize(60);
  doc.font('Helvetica-Bold');
  doc.text('ДИПЛОМ', { align: 'center' });
  doc.fontSize(40);
  doc.text('II СТЕПЕНИ', { align: 'center' });

  // Серебряная печать для 2-го места
  doc.save();
  doc.fill('#C0C0C0');
  doc.circle(doc.page.width / 2, 220, 30);
  doc.fill();

  doc.fill('#7f1d1d');
  doc.fontSize(16);
  doc.font('Helvetica-Bold');
  doc.text('2', doc.page.width / 2 - 5, 215);
  doc.restore();

  // Текст диплома
  doc.moveDown(3);
  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('Награждается', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(35);
  doc.font('Helvetica-Bold');
  doc.text(userName, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('занявший(ая) II место в олимпиаде', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(30);
  doc.font('Helvetica-Bold');
  doc.text(`"${olympiadTitle}"`, { align: 'center' });

  // Китайский символ
  doc.save();
  doc.fill('white');
  doc.opacity(0.1);
  doc.fontSize(150);
  doc.text('汉语', { align: 'center' });
  doc.restore();
}

function addThirdPlaceDiploma(
  doc: PDFKit.PDFDocument,
  userName: string,
  olympiadTitle: string
) {
  // Заголовок диплома
  doc.save();
  doc.fill('white');
  doc.fontSize(60);
  doc.font('Helvetica-Bold');
  doc.text('ДИПЛОМ', { align: 'center' });
  doc.fontSize(40);
  doc.text('III СТЕПЕНИ', { align: 'center' });

  // Бронзовая печать для 3-го места
  doc.save();
  doc.fill('#CD7F32');
  doc.circle(doc.page.width / 2, 220, 30);
  doc.fill();

  doc.fill('#7f1d1d');
  doc.fontSize(16);
  doc.font('Helvetica-Bold');
  doc.text('3', doc.page.width / 2 - 5, 215);
  doc.restore();

  // Текст диплома
  doc.moveDown(3);
  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('Награждается', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(35);
  doc.font('Helvetica-Bold');
  doc.text(userName, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('занявший(ая) III место в олимпиаде', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(30);
  doc.font('Helvetica-Bold');
  doc.text(`"${olympiadTitle}"`, { align: 'center' });

  // Китайский символ
  doc.save();
  doc.fill('white');
  doc.opacity(0.1);
  doc.fontSize(150);
  doc.text('汉语', { align: 'center' });
  doc.restore();
}

function addParticipantDiploma(
  doc: PDFKit.PDFDocument,
  userName: string,
  olympiadTitle: string
) {
  // Заголовок диплома
  doc.save();
  doc.fill('white');
  doc.fontSize(60);
  doc.font('Helvetica-Bold');
  doc.text('СЕРТИФИКАТ', { align: 'center' });
  doc.fontSize(40);
  doc.text('УЧАСТНИКА', { align: 'center' });

  // Текст диплома
  doc.moveDown(3);
  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('Настоящим удостоверяется, что', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(35);
  doc.font('Helvetica-Bold');
  doc.text(userName, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(25);
  doc.font('Helvetica');
  doc.text('принял(а) участие в олимпиаде', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(30);
  doc.font('Helvetica-Bold');
  doc.text(`"${olympiadTitle}"`, { align: 'center' });

  // Китайский символ
  doc.save();
  doc.fill('white');
  doc.opacity(0.1);
  doc.fontSize(150);
  doc.text('汉语', { align: 'center' });
  doc.restore();
}

function addDateAndSignature(doc: PDFKit.PDFDocument) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  doc.save();
  doc.fill('white');
  doc.fontSize(15);
  doc.font('Helvetica');

  // Дата
  doc.text(
    `Дата: ${formattedDate}`,
    doc.page.width - 200,
    doc.page.height - 100,
    { align: 'right' }
  );

  // Добавляем изображение подписи
  const signPath = path.join(process.cwd(), 'public', 'sign.png');
  doc.image(signPath, doc.page.width - 280, doc.page.height - 100, {
    width: 150,
    align: 'right',
  });

  // Текст подписи
  doc.fontSize(12);
  doc.opacity(1);
  doc.text('Подпись организатора', doc.page.width - 200, doc.page.height - 50, {
    align: 'right',
  });
  doc.restore();

  // Добавляем штамп вместо QR-кода
  doc.save();
  const printPath = path.join(process.cwd(), 'public', 'print.png');
  doc.opacity(0.9);
  doc.image(printPath, 60, doc.page.height - 130, {
    width: 100,
  });
  doc.restore();
}
