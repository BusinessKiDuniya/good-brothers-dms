import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Donation } from "@/models/Donation";
import { User } from "@/models/User";

const NGO_NAME = "Good Brothers Trust";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  await dbConnect();

  const { id } = await context.params;

  const donation = await Donation.findOne({
    donationId: id,
    userId: session.user.id,
  }).lean();

  if (!donation) {
    return NextResponse.json(
      { success: false, message: "Donation not found." },
      { status: 404 },
    );
  }

  if (donation.status !== "SUCCESS") {
    return NextResponse.json(
      {
        success: false,
        message: "Receipt only available for successful donations.",
      },
      { status: 400 },
    );
  }

  const donor = await User.findById(session.user.id).lean();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = page.getSize().height - 60;

  page.drawText(NGO_NAME, {
    x: 50,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0.09, 0.32, 0.13),
  });
  y -= 25;
  page.drawText("Donation Receipt", { x: 50, y, size: 14, font });
  y -= 40;

  const lines: [string, string][] = [
    ["Receipt No.", donation.donationId],
    [
      "Date",
      new Date(donation.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    ],
    ["Donor Name", donor?.name || "-"],
    ["Donor Email", donor?.email || "-"],
    ["Donor Mobile", donor?.mobile || "-"],
    ["Project", donation.project],
    ["Donation Type", donation.type === "MONTHLY" ? "Monthly" : "One-time"],
    ["Payment Provider", donation.payment],
    ["Amount", `Rs. ${donation.amount.toLocaleString("en-IN")}`],
  ];

  for (const [label, value] of lines) {
    page.drawText(`${label}:`, { x: 50, y, size: 11, font: boldFont });
    page.drawText(String(value), { x: 200, y, size: 11, font });
    y -= 22;
  }

  y -= 20;
  page.drawText(
    "This receipt is generated electronically and is valid without a signature.",
    { x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) },
  );

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Receipt-${donation.donationId}.pdf"`,
    },
  });
}
