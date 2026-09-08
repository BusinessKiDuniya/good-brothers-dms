import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.nextauth.token;
    const role = req.nextauth.token?.role as string | undefined;

    // Logged-in users cannot access login
    if (pathname === "/login" && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
    const isDashboardRoute =
      pathname === "/dashboard" || pathname.startsWith("/dashboard/");

    // Admin routes require both login AND the admin role
    if (isAdminRoute) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    }

    // Regular protected routes just require login
    if (isDashboardRoute && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  },
);

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/admin/:path*"],
};