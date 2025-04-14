import { NextResponse } from 'next/server';
import { verifyAuth, verifyAdmin } from '@/lib/auth';
import { mkdir, rename } from 'fs/promises';
import { join } from 'path';
import formidable from 'formidable';
import { existsSync } from 'fs';
import { IncomingMessage } from 'http';

// Route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to parse form data
const parseForm = async (
  req: Request & IncomingMessage
): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: Infinity, // Remove file size limit
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
      if (err) {
        // Log formidable specific errors
        console.error("Formidable parsing error:", err);
        reject(err); // Reject the promise
        return;
      }
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
    // Cast req to include IncomingMessage properties for formidable
    const { files } = await parseForm(req as unknown as Request & IncomingMessage);
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

    // Move the file from the temp path to the uploads directory
    const tempFilePath = file.filepath;
    const filePath = join(uploadDir, filename);
    await rename(tempFilePath, filePath); // Use rename for efficiency

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
      // If the filter passed, this shouldn't happen, but good to have a fallback
      console.warn(`Unexpected file type passed filter: ${file.mimetype}`);
      return NextResponse.json({ error: 'Invalid file type processed' }, { status: 400 });
    }

    return NextResponse.json({
      url: fileUrl,
      type: mediaType,
    });
  } catch (error: any) {
    console.error('Upload endpoint error:', error);
    // Check if it's the formidable file size error
    if (error?.code === 'LIMIT_FILE_SIZE') {
      console.error('Caught formidable LIMIT_FILE_SIZE error specifically.');
      return NextResponse.json(
        // Use a distinct message to confirm this block is hit
        { message: `Formidable Error: File size limit exceeded (code: ${error.code}).` },
        { status: 413 } // Payload Too Large
      );
    }
    // Handle other errors
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: error.code === 'ENOENT' ? 400 : 500 } // Handle file not found potentially during rename
    );
  }
}
