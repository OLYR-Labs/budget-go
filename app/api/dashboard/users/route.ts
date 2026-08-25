import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MANAGED_ROLES = ["BRANCH_ADMIN", "BRANCH_STAFF"] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role as ManagedRole;
    const branchId = typeof body.branchId === "string" ? body.branchId : "";

    if (!name || !email || !password || !MANAGED_ROLES.includes(role) || !branchId) {
      return NextResponse.json(
        { error: "Name, email, password, role, and branch are required." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || !branch.isActive) {
      return NextResponse.json({ error: "Active branch not found." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    // Better Auth's createUser endpoint only accepts its built-in
    // "user" / "admin" roles. Branch roles are application-level roles,
    // so create the account first and assign the Prisma role immediately
    // afterward inside our transaction.
    const created = await auth.api.createUser({
      headers: requestHeaders,
      body: {
        name,
        email,
        password,
      },
    });

    if (!created?.user?.id) {
      return NextResponse.json({ error: "Unable to create the user." }, { status: 500 });
    }

    const userId = created.user.id;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { role },
        });

        if (role === "BRANCH_ADMIN") {
          await tx.branchAdmin.create({ data: { userId, branchId } });
        } else {
          await tx.branchStaff.create({ data: { userId, branchId } });
        }
      });
    } catch (relationError) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
      throw relationError;
    }

    return NextResponse.json({
      user: {
        id: userId,
        name,
        email,
        role,
        branch: { id: branch.id, name: branch.name, code: branch.code },
      },
    });
  } catch (error) {
    console.error("Admin user creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please check the server logs." },
      { status: 500 },
    );
  }
}
