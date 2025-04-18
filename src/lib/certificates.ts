import PDFDocument from 'pdfkit';
import { createId } from '@paralleldrive/cuid2';
import fs from 'fs';
import path from 'path';

// --- Font Setup ---
const FONT_REGULAR_PATH = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf');
const FONT_REGULAR_NAME = 'DejaVuSans'; 

// Load font buffer once when the module loads
let fontBuffer: Buffer | null = null;
try {
    if (fs.existsSync(FONT_REGULAR_PATH)) {
        fontBuffer = fs.readFileSync(FONT_REGULAR_PATH);
        console.log(`[certificates.ts] Font buffer loaded successfully from ${FONT_REGULAR_PATH}`);
    } else {
        console.error(`[certificates.ts] Font file NOT FOUND at ${FONT_REGULAR_PATH}. PDF generation will likely fail.`);
    }
} catch (err) {
    console.error(`[certificates.ts] Error reading font file at ${FONT_REGULAR_PATH}:`, err);
}
// --- End Font Setup ---

interface GenerateCertificateParams {
  userName: string;
  olympiadTitle: string;
  olympiadDescription?: string;
  difficulty?: string;
  score?: string;
  place?: string;
  date?: string;
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
  olympiadDescription,
  difficulty,
  score,
  place,
  date = new Date().toLocaleDateString(),
}: GenerateCertificateParams): Promise<string> {
  // Определяем тип диплома на основе места
  const diplomaType = getDiplomaType(place);

  // Используем обновленную функцию для создания диплома, передавая все параметры
  return generateDiploma({
    userName,
    olympiadTitle,
    olympiadDescription,
    difficulty,
    score,
    place,
    date,
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
  olympiadDescription,
  difficulty,
  score,
  place,
  date,
  diplomaType,
}: GenerateDiplomaParams): Promise<string> {
    
  if (!fontBuffer) {
      console.error("[generateDiploma] Font buffer is not available. Cannot generate PDF.");
      throw new Error("Font buffer failed to load, unable to generate certificate.");
  }
    
  console.log("[generateDiploma] Creating PDFDocument instance with autoFirstPage: false...");
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    autoFirstPage: false, // Set autoFirstPage to false
  });
  console.log("[generateDiploma] PDFDocument instance created.");

  // --- Register Font using Buffer --- 
  try {
      console.log(`[generateDiploma] Registering font '${FONT_REGULAR_NAME}' from buffer...`);
      doc.registerFont(FONT_REGULAR_NAME, fontBuffer); 
      console.log(`[generateDiploma] Registered font '${FONT_REGULAR_NAME}' successfully.`);
      
      console.log(`[generateDiploma] Setting default font to '${FONT_REGULAR_NAME}'...`);
      doc.font(FONT_REGULAR_NAME); 
      console.log(`[generateDiploma] Default font set successfully.`);

  } catch (fontError) {
      console.error('[generateDiploma] Error registering font from buffer:', fontError);
      throw new Error('Failed to register font buffer for PDF generation.');
  }
  // --- End Register Font ---
  
  // --- Manually add the first page --- 
  console.log("[generateDiploma] Manually adding the first page...");
  doc.addPage();
  console.log("[generateDiploma] First page added.");
  // --- End Manually add page ---

  const certificatesDir = path.join(process.cwd(), 'public', 'certificates');
  if (!fs.existsSync(certificatesDir)) {
    console.log(`[generateDiploma] Creating certificates directory: ${certificatesDir}`);
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  const certificateId = createId();
  const fileName = `${certificateId}.pdf`;
  const filePath = path.join(certificatesDir, fileName);
  
  console.log(`[generateDiploma] Setting up write stream for: ${filePath}`);
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  // Add background and content
  try {
      doc.font(FONT_REGULAR_NAME); // Ensure font is set
      addBackground(doc, diplomaType);
      
      // Call the combined content function
      console.log(`[generateDiploma] Adding combined content for type: ${diplomaType}`);
      addDiplomaContent(doc, diplomaType, userName, olympiadTitle, score, difficulty, olympiadDescription);
      console.log(`[generateDiploma] Combined content added.`);
      
      console.log(`[generateDiploma] Adding signature and date...`);
      addSignatureAndDate(doc, certificateId);
      console.log(`[generateDiploma] Signature and date added.`);
      
  } catch (contentError) {
      console.error(`[generateDiploma] Error during PDF content generation for ${filePath}:`, contentError);
      // Clean up potentially broken stream/file?
      try { writeStream.end(); fs.unlinkSync(filePath); } catch (cleanupErr) {/* ignore */} 
      throw contentError; // Re-throw error to prevent proceeding
  }

  // --- Modified Error Handling/Waiting Logic --- 
  return new Promise<string>((resolve, reject) => {
    let streamError: Error | null = null;

    writeStream.on('finish', () => {
      if (streamError) {
        // If an error occurred *before* finish, reject
        console.error(`[generateDiploma] writeStream finished, but error was previously caught for ${filePath}. Rejecting.`);
        reject(streamError);
      } else {
        console.log(`[generateDiploma] Successfully finished writing certificate: ${filePath}`);
        resolve(`/certificates/${fileName}`);
      }
    });

    writeStream.on('error', (err) => {
      console.error(`[generateDiploma] writeStream ERROR event for ${filePath}:`, err);
      streamError = err; // Store error
      // Don't reject immediately, let 'finish' handle it or timeout below
      // Attempt to clean up broken file
      try { fs.unlinkSync(filePath); } catch (cleanupErr) {/* ignore */} 
      reject(err); // Reject immediately on stream error now
    });

    // Finalize the PDF document. This triggers the writing process.
    console.log(`[generateDiploma] Calling doc.end() for ${filePath}`);
    doc.end();
    
    // Optional: Add a timeout in case 'finish' or 'error' never fires
    const timeoutMs = 15000; // 15 seconds timeout
    const timeout = setTimeout(() => {
        console.error(`[generateDiploma] Timeout (${timeoutMs}ms) waiting for writeStream finish/error for ${filePath}.`);
        // Attempt cleanup
        try { writeStream.end(); fs.unlinkSync(filePath); } catch (cleanupErr) {/* ignore */} 
        reject(new Error(`Timeout waiting for PDF generation for ${filePath}`));
    }, timeoutMs);

    // Ensure timeout is cleared if finish/error occurs
    writeStream.on('finish', () => clearTimeout(timeout));
    writeStream.on('error', () => clearTimeout(timeout)); 

  });
}

function addBackground(doc: PDFKit.PDFDocument, diplomaType: DiplomaType) {
  const width = doc.page.width;
  const height = doc.page.height;
  
  // Base white background
  doc.rect(0, 0, width, height).fill('#FFFFFF');
  
  // Add elegant blue and gold geometric border pattern
  const borderWidth = 40;
  const borderColor = '#C41E3A'; // Changed from blue to red
  
  // Use chinese-pattern.png as background if available
  const patternPath = path.join(process.cwd(), 'public', 'chinese-pattern.png');
  if (fs.existsSync(patternPath)) {
    // Add pattern image in the background without using the unsupported opacity property
    doc.save();
    doc.fillOpacity(0.15); // Set global opacity before drawing the image
    doc.image(patternPath, 0, 0, { 
      width: width,
      height: height
    });
    doc.fillOpacity(1.0); // Reset opacity
    doc.restore();
  }
  
  // Add red border rectangles (changed from blue)
  doc.rect(0, 0, width, borderWidth).fill(borderColor);
  doc.rect(0, height - borderWidth, width, borderWidth).fill(borderColor);
  doc.rect(0, 0, borderWidth, height).fill(borderColor);
  doc.rect(width - borderWidth, 0, borderWidth, height).fill(borderColor);
  
  // Gold accents at corners
  const cornerSize = 60;
  
  // Top left corner decoration
  doc.save();
  doc.polygon(
    [0, 0],
    [cornerSize, 0],
    [0, cornerSize]
  ).fill('#D4AF37'); // Gold
  
  // Top right corner decoration
  doc.polygon(
    [width, 0],
    [width - cornerSize, 0],
    [width, cornerSize]
  ).fill('#D4AF37'); // Gold
  
  // Bottom left corner decoration
  doc.polygon(
    [0, height],
    [cornerSize, height],
    [0, height - cornerSize]
  ).fill('#D4AF37'); // Gold
  
  // Bottom right corner decoration
  doc.polygon(
    [width, height],
    [width - cornerSize, height],
    [width, height - cornerSize]
  ).fill('#D4AF37'); // Gold
  
  doc.restore();
}

function addDiplomaContent(
  doc: PDFKit.PDFDocument,
  diplomaType: DiplomaType,
  userName: string,
  olympiadTitle: string,
  score?: string,
  difficulty?: string,
  olympiadDescription?: string
) {
  const width = doc.page.width;
  const height = doc.page.height;
  const contentX = 80; // Left margin
  const contentWidth = width - contentX * 2;
  let currentY = 80; // Starting Y position
  const mainTextColor = '#333333'; // Dark Grey for text
  const titleColor = '#1A5B8C'; // Blue for titles
  const accentColor = '#D4AF37'; // Gold for accents
  
  // Main Title - ДИПЛОМ
  doc.font(FONT_REGULAR_NAME).fillColor(titleColor);
  doc.fontSize(48).text('ДИПЛОМ', contentX, currentY, { width: contentWidth, align: 'center' });
  currentY += 60;

  // Sub Title based on diploma type
  let subTitle = '';
  switch (diplomaType) {
    case DiplomaType.FIRST_PLACE: subTitle = 'Победителя I степени'; break;
    case DiplomaType.SECOND_PLACE: subTitle = 'Победителя II степени'; break;
    case DiplomaType.THIRD_PLACE: subTitle = 'Победителя III степени'; break;
    case DiplomaType.PARTICIPANT: subTitle = 'Участника'; break;
  }
  
  doc.fontSize(24).text(subTitle, contentX, currentY, { width: contentWidth, align: 'center' });
  currentY += 30;
  
  // Olympiad organization line
  doc.fontSize(16).fillColor(mainTextColor);
  doc.text('Олимпиады по китайскому языку на платформе ChineseStar', contentX, currentY, { width: contentWidth, align: 'center' });
  currentY += 50;

  // Name introduction text
  doc.fontSize(14).fillColor(mainTextColor);
  doc.text('Настоящим награждается', contentX, currentY, { width: contentWidth, align: 'center' });
  currentY += 30;

  // User Name - Use the passed userName parameter
  doc.fontSize(28).fillColor(accentColor);
  doc.text(userName, contentX, currentY, { width: contentWidth, align: 'center' });
  currentY += 40;

  // Position/School information with difficulty
  doc.fontSize(16).fillColor(mainTextColor);
  let difficultyText = "уровень " + (difficulty ? difficulty : '');
  if (score) {
    difficultyText += difficultyText ? ' · ' : '';
    difficultyText += `баллы: ${score}`;
  }
  doc.text(difficultyText, contentX, currentY, { width: contentWidth, align: 'center' });
  currentY += 25;
  

  // Use provided olympiad title
  doc.fontSize(16).fillColor(titleColor);
  doc.text(olympiadTitle, contentX, currentY, { width: contentWidth, align: 'center' });
  
  // Add decorative line under title
  const lineY = currentY + 30;
  const lineWidth = 150;
  doc.moveTo(width/2 - lineWidth/2, lineY)
     .lineTo(width/2 + lineWidth/2, lineY)
     .lineWidth(2)
     .strokeColor(accentColor)
     .stroke();
}

function addSignatureAndDate(doc: PDFKit.PDFDocument, id?: string) {
  const width = doc.page.width;
  const height = doc.page.height;
  
  // Bottom section positioning
  const bottomY = height - 150; // Position for the bottom section elements

  // Bottom left section - Stamp
  const stampPath = path.join(process.cwd(), 'public', 'stamps', 'stamp.png');
  const stampSize = 80;
  if (fs.existsSync(stampPath)) {
    console.log(`[addSignatureAndDate] Adding stamp from ${stampPath}`);
    // Position stamp on the left side
    doc.image(stampPath, width / 3 - stampSize / 3, bottomY - 20, {
      width: stampSize
    });
  } else {
    // Draw a placeholder circular stamp if no image
    doc.save();
    doc.circle(width / 3, bottomY, 40)
      .lineWidth(2)
      .fillOpacity(0.1)
      .fillColor('#1A5B8C')
      .fill()
      .strokeColor('#1A5B8C')
      .stroke();
    doc.fillOpacity(1).fillColor('#1A5B8C');
    doc.fontSize(10);
    doc.text('ПЕЧАТЬ', width / 3 - 20, bottomY - 4);
    doc.restore();
  }
  
  // Bottom right section - Тришкина name and signature
  doc.fontSize(14).fillColor('#333333');
  // Position name on the right side
  doc.text('Тришкина Екатерина Васильевна', width * 2/3, bottomY, { width: 200, align: 'center' });
  
  // Add signature image UNDER the name on the right
  const signPath = path.join(process.cwd(), 'public', 'sign.png');
  if (fs.existsSync(signPath)) {
    console.log(`[addSignatureAndDate] Adding signature from ${signPath}`);
    // Position signature BELOW the name on the right
    doc.image(signPath, width * 2/3 + 50, bottomY + 25, { 
      width: 80
    });
  }
  
  // Date on the bottom left
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const formattedDate = `${day}.${month}.${year}`;
  
  doc.fontSize(12).fillColor('#333333'); // Darker color for better visibility
  doc.text(`Дата: ${formattedDate}`, 80, height - 55);
  
  // Certificate ID at the bottom left below the date
  if (id) {
    doc.fontSize(10).fillColor('#333333'); // Darker color for better visibility 
    doc.text(`ID: ${id}`, 80, height - 30);
  }
  
  // URL at the bottom right
  doc.fontSize(12).fillColor('#1A5B8C'); // Blue color for better visibility
  doc.text('www.chinesestar.ru', width - 160, height - 55);
}
