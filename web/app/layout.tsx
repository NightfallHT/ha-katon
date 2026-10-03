import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist_Mono } from "next/font/google";
import { Header } from "@/components/shell/header";
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
        <script dangerouslySetInnerHTML={{ __html: a11yBoot }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Przejdź do treści
        </a>
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 outline-none"
        >
          {children}
        </main>
        <HelpBot />
        <footer className="border-t">
          <div className="mx-auto max-w-5xl px-4 pt-6 pb-20 text-sm">
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
