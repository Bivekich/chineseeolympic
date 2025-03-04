import { NextResponse } from 'next/server';
import { verifyAuth, verifyAdmin } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import formidable from 'formidable';
import { existsSync } from 'fs';
import { IncomingMessage } from 'http';

// New route configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Disable default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse form data
const parseForm = async (
  req: Request & IncomingMessage
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowEmptyFiles: false,
      filter: function ({ mimetype }) {
        // Accept only images, videos, and audio files
        return (
          mimetype?.includes('image/') ||
          mimetype?.includes('video/') ||
          mimetype?.includes('audio/') ||
          false
        );
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export async function POST(req: Request) {
  try {
    // Verify authentication and admin status
    const userId = await verifyAuth();
    const isAdmin = await verifyAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(
      process.cwd(),
      'public',
      'uploads',
      'olympiad-media'
    );
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Parse the form data
    const { files } = await parseForm(req as Request & IncomingMessage);
    const file = files.file?.[0];

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const originalName = file.originalFilename || 'file';
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}-${Math.random()
      .toString(36)
      .substring(2)}.${extension}`;

    // Move the file to the uploads directory
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, await readFile(file.filepath));

    // Generate the URL for the uploaded file
    const fileUrl = `/uploads/olympiad-media/${filename}`;

    // Determine media type
    let mediaType: 'image' | 'video' | 'audio';
    if (file.mimetype?.includes('image/')) {
      mediaType = 'image';
    } else if (file.mimetype?.includes('video/')) {
      mediaType = 'video';
    } else if (file.mimetype?.includes('audio/')) {
      mediaType = 'audio';
    } else {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    return NextResponse.json({
      url: fileUrl,
      type: mediaType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Helper function to read file contents
async function readFile(filepath: string): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of require('fs').createReadStream(filepath)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
