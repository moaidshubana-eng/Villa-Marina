import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge Runtime: لا Prisma ولا bcrypt هنا - فقط التحقق من توقيع الجلسة عبر jose.
const SESSION_COOKIE = "villamarina_session";
const PUBLIC_PATHS = ["/login"];

function getSecretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, getSecretKey());
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
