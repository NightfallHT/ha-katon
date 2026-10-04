import { Suspense } from "react";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/shell/header";
import { AccessibilityPanel } from "@/components/shell/accessibility-panel";
import { BackHome } from "@/components/shell/back-home";
import { DemoTour } from "@/components/shell/demo-tour";
import { HelpBot } from "@/components/help-bot";
import "./globals.css";

const sans = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Małopolski Hub Innowacji Społecznych",
  description:
    "Platforma, która łączy mieszkańców, organizacje i gminy wokół innowacji społecznych w Małopolsce.",
};

const a11yBoot = `
try {
  var f = localStorage.getItem("font");
  var c = localStorage.getItem("contrast");
  if (f) document.documentElement.setAttribute("data-font", f);
  if (c) document.documentElement.setAttribute("data-contrast", c);
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies saved font size / contrast before first paint. A raw <script> here
            triggers React's "script tag while rendering" warning on client re-renders. */}
        <Script id="a11y-boot" strategy="beforeInteractive">
          {a11yBoot}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Przejdź do treści
        </a>
        <AccessibilityPanel />
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 outline-none md:px-8 lg:py-14"
        >
          <BackHome />
          {children}
        </main>
        <HelpBot />
        {/* Mounted outside <main> so navigating between steps never unmounts it. */}
        <Suspense fallback={null}>
          <DemoTour />
        </Suspense>
        <footer className="border-t">
          <div className="mx-auto max-w-7xl px-5 pb-20 pt-6 text-sm md:px-8">
            <p>
              Prototyp zbudowany na HackYeah 2026 dla ROPS Kraków. Dane są
              przykładowe.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
