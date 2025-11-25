import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <NextIntlClientProvider messages={messages}>
            <div className="relative flex flex-col min-h-screen h-full bg-gradient-radial from-white/0 to-lime-500/10 dark:to-lime-500/10 from-60% to-[100%]">
              <Navbar />
              <main className="container mx-auto max-w-7xl px-6 flex-grow ">
                {children}
              </main>
              {/*<footer className="w-full flex items-center justify-center py-3">*/}
              {/*  <Link*/}
              {/*    isExternal*/}
              {/*    className="flex items-center gap-1 text-current"*/}
              {/*    href="https://heroui.com?utm_source=next-app-template"*/}
              {/*    title="heroui.com homepage"*/}
              {/*  >*/}
              {/*    <span className="text-default-600">Powered by</span>*/}
              {/*    <p className="text-primary">HeroUI</p>*/}
              {/*  </Link>*/}
              {/*</footer>*/}
            </div>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
