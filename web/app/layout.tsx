import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// latin-ext is required for Polish diacritics (ą ć ę ł ń ó ś ź ż).
// The variable name must stay --font-sans: globals.css maps it in @theme inline.
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* First focusable element on every page (AGENTS.md §7). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Przejdź do treści
        </a>

        {/* TODO(ola, task 3): replace with components/shell/Header — logo, main nav,
            role switcher, font-size toggle (A / A+ / A++), high-contrast toggle. */}
        <header className="border-b">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
            <span className="font-semibold">Hub Innowacji Społecznych</span>
            <nav aria-label="Menu główne" className="ml-auto">
              <ul className="flex flex-wrap gap-4">
                <li>
                  <Link className="underline underline-offset-4" href="/">
                    Start
                  </Link>
                </li>
                <li>
                  <Link className="underline underline-offset-4" href="/biblioteka">
                    Biblioteka
                  </Link>
                </li>
                <li>
                  <Link className="underline underline-offset-4" href="/wyzwania">
                    Wyzwania
                  </Link>
                </li>
                <li>
                  <Link className="underline underline-offset-4" href="/materialy">
                    Materiały
                  </Link>
                </li>
                <li>
                  <Link className="underline underline-offset-4" href="/kreator">
                    Kreator
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {children}
        </main>

        {/* TODO(jakub): global <HelpBot /> slot goes here. */}

        <footer className="border-t">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm">
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
