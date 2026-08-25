import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const isDashboardOrdersApi =
    pathname === "/api/dashboard/orders" ||
    pathname.startsWith("/api/dashboard/orders/");

  if (!isDashboard && !isDashboardOrdersApi) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    if (isDashboardOrdersApi) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource." },
        { status: 401 },
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.user.role;

  if (role === "BRANCH_STAFF") {
    if (isDashboardOrdersApi) {
      return NextResponse.json(
        { error: "Branch staff do not have access to orders." },
        { status: 403 },
      );
    }

    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.redirect(
        new URL("/dashboard/branch", request.url),
      );
    }
  }

  if (role === "BRANCH_ADMIN") {
    return NextResponse.next();
  }

  if (role === "ADMIN") {
    return NextResponse.next();
  }

  if (isDashboardOrdersApi) {
    return NextResponse.json(
      { error: "You do not have permission to access orders." },
      { status: 403 },
    );
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/dashboard/orders/:path*",
  ],
};
