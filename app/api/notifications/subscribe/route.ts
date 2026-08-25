import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) {
      return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        userId: session.user.id,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
      create: {
        userId: session.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json({ ok: true, id: subscription.id });
  } catch (error) {
    console.error("Push subscription failed:", error);
    return NextResponse.json({ error: "Could not register this device for notifications." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = (await request.json()) as { endpoint?: string };
  if (body.endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id, endpoint: body.endpoint } });
  }

  return NextResponse.json({ ok: true });
}
