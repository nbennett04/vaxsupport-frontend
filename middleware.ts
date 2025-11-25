import { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Extract locale from pathname (e.g., "/en/chat" → "en")
  const localeMatch = pathname.match(/^\/(en|es)/);
  const locale = localeMatch ? localeMatch[1] : "en"; // Default to English

  // Handle Internationalization Middleware
  const intlMiddleware = createMiddleware(routing);

  return intlMiddleware(req);
}

// Apply middleware to all localized routes
export const config = {
  matcher: ["/", "/(en|es)/:path*"], // Adjust based on supported locales
};
