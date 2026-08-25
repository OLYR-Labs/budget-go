import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const isDashboardApi = pathname === "/api/dashboard" || pathname.startsWith("/api/dashboard/");

  const isDashboardOrdersApi =
    pathname === "/api/dashboard/orders" ||
    pathname.startsWith("/api/dashboard/orders/");

  if (!isDashboard && !isDashboardApi) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    if (isDashboardApi) {
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

    // The general dashboard endpoint contains branch revenue/order data.
    // Staff must use the inventory-only endpoint instead.
    if (pathname === "/api/dashboard" || pathname === "/api/dashboard/") {
      return NextResponse.json(
        { error: "Branch staff only have access to inventory." },
        { status: 403 },
      );
    }

    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.redirect(
        new URL("/dashboard/branch", request.url),
      );
    }

    return NextResponse.next();
  }

  if (role === "BRANCH_ADMIN" || role === "ADMIN") {
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
    "/api/dashboard/:path*",
  ],
};
