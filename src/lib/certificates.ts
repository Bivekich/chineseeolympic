import PDFDocument from "pdfkit";
import { createId } from "@paralleldrive/cuid2";
import fs from "fs";
import path from "path";

interface GenerateCertificateParams {
  userName: string;
  olympiadTitle: string;
  place?: string;
}

export async function generateCertificate({
  userName,
  olympiadTitle,
  place,
}: GenerateCertificateParams): Promise<string> {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
  });

  // Create certificates directory if it doesn't exist
  const certificatesDir = path.join(process.cwd(), "public", "certificates");
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

  // Design the certificate
  doc
    .font("Helvetica-Bold")
    .fontSize(40)
    .text("СЕРТИФИКАТ", { align: "center" })
    .moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(20)
    .text("Настоящим удостоверяется, что", { align: "center" })
    .moveDown(0.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .text(userName, { align: "center" })
    .moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(20)
    .text(
      place
        ? `занял(а) ${place} место в олимпиаде`
        : "принял(а) участие в олимпиаде",
      { align: "center" }
    )
    .moveDown(0.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .text(`"${olympiadTitle}"`, { align: "center" })
    .moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(15)
    .text(new Date().toLocaleDateString(), { align: "center" });

  // Finalize the PDF
  doc.end();

  // Wait for the file to be written
  await new Promise((resolve) => writeStream.on("finish", resolve));

  // Return the URL
  return `/certificates/${fileName}`;
}
