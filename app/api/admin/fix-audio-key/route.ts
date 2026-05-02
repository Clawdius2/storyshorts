import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Update Gift of the Magi audio_key to correct R2 path (gutenbergId 7256)
    const result = await prisma.book.update({
      where: { id: "free-gift-of-the-magi" },
      data: {
        audioKey: "books/7256/audio/O._Henry.The_Gift_of_the_Magi.mp3",
        gutenbergId: "7256",
      },
    });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
