import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { olympiads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "public", "uploads", "olympiad-media");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify olympiad ownership
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    if (!olympiad) {
      return NextResponse.json(
        { message: "Olympiad not found" },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type;
    if (!fileType.match(/^(image|video|audio)\//)) {
      return NextResponse.json(
        { message: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `${createId()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Convert File to Buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Determine media type
    let mediaType: "image" | "video" | "audio";
    if (fileType.startsWith("image/")) {
      mediaType = "image";
    } else if (fileType.startsWith("video/")) {
      mediaType = "video";
    } else if (fileType.startsWith("audio/")) {
      mediaType = "audio";
    } else {
      // This shouldn't happen due to earlier validation, but just in case
      return NextResponse.json(
        { message: "Invalid file type" },
        { status: 400 }
      );
    }

    // Return the file URL and type
    return NextResponse.json({
      url: `/uploads/olympiad-media/${uniqueFilename}`,
      type: mediaType
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
