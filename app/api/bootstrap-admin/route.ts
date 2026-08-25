import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Not available." }, { status: 404 });
    }

    const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

    if (!email) {
      return NextResponse.json({ error: "ADMIN_BOOTSTRAP_EMAIL is not configured." }, { status: 500 });
    }

    if (!password) {
      return NextResponse.json({ error: "ADMIN_BOOTSTRAP_PASSWORD is not configured." }, { status: 500 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
      const result = await auth.api.signUpEmail({
        body: {
          name: "Admin",
          email,
          password,
        },
      });

      if (!result?.user) {
        return NextResponse.json({ error: "Better Auth did not create the user." }, { status: 500 });
      }

      await prisma.user.update({
        where: { id: result.user.id },
        data: { role: "ADMIN" },
      });

      return NextResponse.json({ ok: true, action: "admin_created" });
    }

    if (existingUser.role === "ADMIN") {
      return NextResponse.json({ error: "Admin account already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "User already exists but is not an admin." }, { status: 409 });
  } catch (error) {
    console.error("BOOTSTRAP ADMIN ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to bootstrap admin." },
      { status: 500 },
    );
  }
}
