import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { olympiads, participantResults, users } from "@/lib/db/schema";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { generateCertificate } from "@/lib/certificates";
import { sendEmail } from "@/lib/email";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function getUserId() {
  const token = cookies().get("auth-token")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload.userId as string;
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get olympiad and verify ownership
    const olympiad = await db.query.olympiads.findFirst({
      where: eq(olympiads.id, params.id),
    });

    if (!olympiad) {
      return NextResponse.json(
        { message: "Олимпиада не найдена" },
        { status: 404 }
      );
    }

    if (olympiad.creatorId !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (olympiad.isCompleted) {
      return NextResponse.json(
        { message: "Олимпиада уже завершена" },
        { status: 400 }
      );
    }

    // Get all participants with their results
    const results = await db
      .select({
        result: participantResults,
        user: users,
      })
      .from(participantResults)
      .innerJoin(users, eq(participantResults.userId, users.id))
      .where(eq(participantResults.olympiadId, params.id))
      .orderBy((fields) => fields.result.score);

    // Calculate places and generate certificates
    const updatedResults = await Promise.all(
      results.map(async ({ result, user }, index) => {
        const place = results.length - index; // Reverse order since we sorted by score
        const isWinner = place <= 3;

        // Generate certificate
        const certificateUrl = await generateCertificate({
          userName: user.email,
          olympiadTitle: olympiad.title,
          place: isWinner ? place.toString() : undefined,
        });

        // Update result with place and certificate
        await db
          .update(participantResults)
          .set({
            place: place.toString(),
            certificateUrl,
          })
          .where(eq(participantResults.id, result.id));

        // Send email
        await sendEmail({
          to: user.email,
          subject: isWinner
            ? `Поздравляем! Вы заняли ${place} место в олимпиаде "${olympiad.title}"`
            : `Спасибо за участие в олимпиаде "${olympiad.title}"`,
          html: `
            <h1>${isWinner ? "Поздравляем!" : "Спасибо за участие!"}</h1>
            <p>Олимпиада: ${olympiad.title}</p>
            ${
              isWinner
                ? `<p>Вы заняли ${place} место!</p>
            <p>Ваш промокод: ${olympiad.promoCode}</p>`
                : ""
            }
            <p>Ваш сертификат доступен по ссылке: <a href="${certificateUrl}">Скачать сертификат</a></p>
          `,
        });

        return {
          ...result,
          place: place.toString(),
          certificateUrl,
        };
      })
    );

    // Mark olympiad as completed
    await db
      .update(olympiads)
      .set({ isCompleted: true })
      .where(eq(olympiads.id, params.id));

    return NextResponse.json(updatedResults);
  } catch (error) {
    console.error("Error finalizing olympiad:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
