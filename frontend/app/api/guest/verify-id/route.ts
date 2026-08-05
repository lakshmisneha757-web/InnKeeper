import { NextRequest, NextResponse } from "next/server";
import { compareIdentityImages, BIOMETRIC_MATCH_THRESHOLDS } from "@/lib/image-similarity";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL ? new PrismaPg({ connectionString: process.env.DATABASE_URL }) : undefined,
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = (form.get("token") as string) || "";
    const idDocument = form.get("idDocument");
    const selfie = form.get("selfie");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
    if (!(idDocument instanceof Blob) || !(selfie instanceof Blob)) {
      return NextResponse.json({ error: "Missing idDocument or selfie file" }, { status: 400 });
    }

    const result = await compareIdentityImages(idDocument, selfie);
    const isMatch =
      result.faceDetectedInId &&
      result.faceDetectedInSelfie &&
      result.distance <= BIOMETRIC_MATCH_THRESHOLDS.maxDistanceForMatch &&
      result.score >= BIOMETRIC_MATCH_THRESHOLDS.minScoreForMatch;

    const status: "verified" | "failed" = isMatch ? "verified" : "failed";

    if (!isMatch && !result.errorReason) {
      result.errorReason = "Verification failed — the uploaded photos do not match. Please upload a clear ID and selfie of the same person.";
    }

    let verificationId = "ver_demo_1";

    try {
      const reservation = await prisma.reservation.findFirst({
        where: { checkInToken: token },
        include: { guest: true },
      });

      if (reservation) {
        const lastAttempt = await prisma.identityVerificationAttempt.findFirst({
          where: { reservationId: reservation.id },
          orderBy: { attemptNumber: "desc" },
        });

        const attemptNumber = Number(lastAttempt?.attemptNumber || 0) + 1;

        const attempt = await prisma.identityVerificationAttempt.create({
          data: {
            reservationId: reservation.id,
            guestId: reservation.guestId,
            guestName: reservation.guest?.fullName || "Guest",
            idImage: "/uploads/id-doc.jpg",
            selfieImage: "/uploads/selfie.jpg",
            faceDistance: result.distance,
            verificationStatus: isMatch ? "VERIFIED" : "FAILED",
            attemptNumber,
            verifiedAt: isMatch ? new Date() : null,
          },
        });

        verificationId = attempt.id;

        await prisma.identityVerification.upsert({
          where: { reservationId: reservation.id },
          create: {
            reservationId: reservation.id,
            idDocumentUrl: "/uploads/id-doc.jpg",
            selfieUrl: "/uploads/selfie.jpg",
            guestId: reservation.guestId,
            guestName: reservation.guest?.fullName || "Guest",
            idImage: "/uploads/id-doc.jpg",
            selfieImage: "/uploads/selfie.jpg",
            faceDistance: result.distance,
            verificationStatus: isMatch ? "VERIFIED" : "FAILED",
            attemptNumber,
            status: isMatch ? "VERIFIED" : "FAILED",
            verifiedAt: isMatch ? new Date() : null,
          },
          update: {
            idDocumentUrl: "/uploads/id-doc.jpg",
            selfieUrl: "/uploads/selfie.jpg",
            guestId: reservation.guestId,
            guestName: reservation.guest?.fullName || "Guest",
            idImage: "/uploads/id-doc.jpg",
            selfieImage: "/uploads/selfie.jpg",
            faceDistance: result.distance,
            verificationStatus: isMatch ? "VERIFIED" : "FAILED",
            attemptNumber,
            status: isMatch ? "VERIFIED" : "FAILED",
            verifiedAt: isMatch ? new Date() : null,
          },
        });

        if (isMatch) {
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: { checkInStatus: "ID_VERIFIED" },
          });
        }
      }
    } catch (dbErr) {
      console.error("Database update error:", dbErr);
    }

    return NextResponse.json({
      status,
      score: result.score,
      distance: result.distance,
      faceDetectedInId: result.faceDetectedInId,
      faceDetectedInSelfie: result.faceDetectedInSelfie,
      errorReason: result.errorReason,
      verificationId,
    });
  } catch (err: any) {
    console.error("[verify-id] Unexpected error:", err?.message ?? err);
    return NextResponse.json(
      {
        status: "failed",
        score: 0,
        distance: 1.0,
        faceDetectedInId: false,
        faceDetectedInSelfie: false,
        verificationId: "ver_demo_1",
        errorReason:
          err?.message?.includes("face")
            ? err.message
            : "Verification could not be completed. Please upload clear, well-lit photos and try again.",
      },
      { status: 200 }
    );
  }
}




