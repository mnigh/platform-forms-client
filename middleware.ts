import { NextResponse, userAgent } from "next/server";
import acceptLanguage from "accept-language";
import { fallbackLng, languages } from "./app/i18n/settings";
import type { NextRequest } from "next/server";
import { generateCSP } from "@lib/cspScripts";
import { logMessage } from "@lib/logger";

acceptLanguage.languages(languages);

export function middleware(req: NextRequest) {
  const interalRoute = new RegExp("^/(api|_next|favicon.ico|img|static|react_devtools).*$");
  const pathname = req.nextUrl.pathname;
  const pathLang = pathname.split("/")[1];
  const cookieLang = req.cookies.get("i18next")?.value;

  const requestHeaders = new Headers(req.headers);
  const prefetch =
    requestHeaders.get("purpose") === "prefetch" || requestHeaders.get("next-router-prefetch");

  // We don't want to internationalize internal routes or prefetch requests
  if (!interalRoute.test(pathname) && !prefetch) {
    // Layer 1 - Redirect to language selector if app path is not provided

    if (languages.some((lang) => new RegExp(`^/${lang}/?$`).test(pathname))) {
      const redirect = NextResponse.redirect(new URL("/", req.url));
      // Set cookie on response back to browser so client can render correct language on client components
      redirect.cookies.set("i18next", pathLang);
      logMessage.debug(
        `Middleware - Redirecting to language selector: ${pathname} pathlang: ${pathLang} `
      );
      return redirect;
    }

    // Layer 2 - Redirect to url with locale if lng in path is not present or supported

    if (pathname !== "/" && !languages.some((loc) => new RegExp(`^/${loc}/.+$`).test(pathname))) {
      // Check to see if language cookie is present
      if (languages.some((lang) => lang === cookieLang)) {
        // Cookies language is already supported, redirect to that language
        logMessage.debug(
          `Middleware - Redirecting to cookie language: ${cookieLang}, pathname: ${pathname}`
        );
        return NextResponse.redirect(new URL(`/${cookieLang}${pathname}`, req.url));
      } else {
        // Redirect to fallback language
        logMessage.debug(`Middleware - Redirecting to fallback language: : ${pathname}`);
        return NextResponse.redirect(new URL(`/${fallbackLng}${pathname}`, req.url));
      }
    }

    // Layer 3 - Language Cookie Sync

    let cookieSyncRequired = false;
    if (pathLang && cookieLang !== pathLang) {
      logMessage.debug(`Middleware - Setting language cookie: ${cookieLang} for path: ${pathname}`);
      // Set missing cookie on incoming request so server can render correct language on server components
      req.cookies.set("i18next", pathLang);
      cookieSyncRequired = true;
    }

    // Layer 4 - Set Content Security Policy

    // Set the Content Security Policy (CSP) header
    const { csp, nonce } = generateCSP();

    // Set the CSP header on the request to the server
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("content-security-policy", csp);

    // Create base Next Response with CSP header and i18n cookie
    const response = NextResponse.next({
      headers: requestHeaders,
    });

    // Set the CSP header on the response to the browser
    response.headers.set("content-security-policy", csp);

    // From layer 3
    // Set cookie on response back to browser so client can render correct language on client components
    if (cookieSyncRequired) response.cookies.set("i18next", pathLang);

    return response;
  }
  // Making sure we do not create an infinite ("redirect") loop when trying to load the logo on the unsupported browser page
  //@todo Check to see if this is still required given the additional middleware logic and app router.
  const imgPathRegEx = new RegExp(`^/img/.*$`);
  if (imgPathRegEx.test(pathname)) {
    const { browser } = userAgent(req);
    if (browser.name?.toLocaleLowerCase() === "ie") {
      return NextResponse.rewrite(`${req.nextUrl.origin}/unsupported-browser.html`);
    }
  }

  return NextResponse.next();
}
