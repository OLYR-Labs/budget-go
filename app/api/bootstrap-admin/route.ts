import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Not available." },
        { status: 404 },
      );
    }

    const email = "banukadissanayaka96@gmail.com";
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

    if (!password) {
      return NextResponse.json(
        {
          error: "ADMIN_BOOTSTRAP_PASSWORD is not configured.",
        },
        { status: 500 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // If the user doesn't exist, create them through Better Auth.
    if (!existingUser) {
      let result;

      try {
        result = await auth.api.signUpEmail({
          body: {
            name: "Banuka",
            email,
            password,
          },
        });
      } catch (error) {
        console.error(
          "BETTER AUTH SIGNUP ERROR:",
          error,
        );

        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
          { status: 500 },
        );
      }

      if (!result?.user) {
        console.error(
          "BETTER AUTH DID NOT RETURN A USER:",
          result,
        );

        return NextResponse.json(
          {
            error:
              "Better Auth did not create the user.",
          },
          { status: 500 },
        );
      }

      await prisma.user.update({
        where: {
          id: result.user.id,
        },
        data: {
          role: "ADMIN",
        },
      });

      return NextResponse.json({
        ok: true,
        action: "admin_created",
        email,
      });
    }

    // User already exists and is already an admin.
    if (existingUser.role === "ADMIN") {
      return NextResponse.json(
        {
          error: "Admin account already exists.",
        },
        { status: 409 },
      );
    }

    // User exists but is not an admin.
    return NextResponse.json(
      {
        error:
          "User already exists but is not an admin.",
      },
      { status: 409 },
    );
  } catch (error) {
    console.error(
      "BOOTSTRAP ADMIN ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}