import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const role = session.user.role;
  const allowed = role === "ADMIN" || role === "BRANCH_ADMIN" || role === "BRANCH_STAFF" || role === "DELIVERY_STAFF";

  return NextResponse.json({
    enabled: allowed && Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    publicKey: allowed ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null : null,
  });
}
