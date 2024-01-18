import { dir } from "i18next";
import "../styles/app.scss";
import { Viewport } from "next";
import Script from "next/script";
import "react-app-polyfill/stable";
import { cookies } from "next/headers";
import { languages } from "@i18n/settings";
import { Noto_Sans, Lato } from "next/font/google";
import { googleTagManager } from "@lib/cspScripts";
import { headers } from "next/headers";
import { auth } from "@lib/auth";

const notoSans = Noto_Sans({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const lato = Lato({
  weight: ["400", "700"],
  variable: "--font-lato",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const NoIndexMetaTag =
  process.env.INDEX_SITE === "true" ? null : (
    <>
      {/* The msvalidate.01 meta tag is used to verify ownership of the website for Bing in order to get the staging URL out of search results.*/}
      <meta name="msvalidate.01" content="90CA81AA34C5B1B1F53A42906A93992A" />
      <meta name="robots" content="noindex,nofollow" />
    </>
  );

const css = `
    a:active {
        box-shadow: none !important;
    }

    html {
      font-family: ${notoSans.style.fontFamily};
    }
`;

export default async function Layout({ children }: { children: React.ReactNode }) {
  const locale = cookies().get("i18next")?.value ?? languages[0];
  const nonce = headers().get("x-nonce") ?? "";
  const session = await auth();
  return (
    <html lang={locale} dir={dir(locale)} className={`${notoSans.variable} ${lato.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta charSet="utf-8" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" sizes="32x32" />
        <style>{css}</style>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <meta name="authenticated" content={session ? "true" : "false"} />
        <Script
          nonce={nonce}
          async
          type="text/javascript"
          src="/static/scripts/form-polyfills.js"
        />
        {NoIndexMetaTag}
        <Script id="GoogleTagManager" nonce={nonce} async type="text/javascript">
          {googleTagManager}
        </Script>

        {/* Will only run if Browser does not have JS enabled */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W3ZVVX5"
            title="Google Tag Manager Iframe Window"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
          <style type="text/css">{`#__next {display:none;}`}</style>
          <meta httpEquiv="Refresh" content="0; url='/javascript-disabled.html'" />
        </noscript>
      </head>

      <body className="gc-formview">{children}</body>
    </html>
  );
}
