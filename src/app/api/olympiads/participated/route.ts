import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads, participantResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await verifyAuth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching participated olympiads for user:", userId); // Debug log

    const results = await db
      .select({
        result: participantResults,
        olympiad: olympiads,
      })
      .from(participantResults)
      .innerJoin(olympiads, eq(participantResults.olympiadId, olympiads.id))
      .where(eq(participantResults.userId, userId));

    console.log("Found results:", results); // Debug log

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching participated olympiads:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
