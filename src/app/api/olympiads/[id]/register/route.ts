import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { participantDetails } from "@/lib/db/schema";
import { verifyAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, educationType, grade, institutionName, phoneNumber } =
      body;

    // Validate required fields
    if (!fullName || !educationType || !phoneNumber) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate education fields if type is school or university
    if (
      (educationType === "school" || educationType === "university") &&
      (!grade || !institutionName)
    ) {
      return NextResponse.json(
        { message: "Missing education details" },
        { status: 400 }
      );
    }

    // Save participant details
    const [details] = await db
      .insert(participantDetails)
      .values({
        userId,
        olympiadId: params.id,
        fullName,
        educationType,
        grade: grade || null,
        institutionName: institutionName || null,
        phoneNumber,
      })
      .returning();

    return NextResponse.json(details);
  } catch (error) {
    console.error("Error registering participant:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
