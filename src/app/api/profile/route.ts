import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  await dbConnect();

  const user = await User.findById(session.user.id).lean();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email ?? null,
      mobile: user.mobile ?? null,
      image: user.image ?? null,
      provider: user.provider,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  if (name !== undefined && name.length === 0) {
    return NextResponse.json(
      { success: false, message: "Name cannot be empty." },
      { status: 400 },
    );
  }

  await dbConnect();

  const updated = await User.findByIdAndUpdate(
    session.user.id,
    name !== undefined ? { name } : {},
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 },
    );
  }

 return NextResponse.json({
    success: true,
    user: {
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email ?? null,
      mobile: updated.mobile ?? null,
      image: updated.image ?? null,
    },
  });
}
