import Link from "next/link";
import { cookies } from "next/headers";
import { BookOpen, FileText, Lightbulb } from "lucide-react";
import { ContactForm } from "./form";

export const metadata = { title: "Kontakt | Hub Innowacji Społecznych" };

const STEPS = [
  {
    title: "Wiadomość trafia do ROPS",
    text: "Zapisujemy ją razem z pozostałymi zgłoszeniami, więc nic nie ginie w skrzynce.",
  },
  {
    title: "Czyta ją człowiek",
    text: "Pracownik Hubu sprawdza, kto w zespole odpowie najlepiej.",
  },
  {
    title: "Dostajesz odpowiedź e-mailem",
    text: "W ciągu 2 dni roboczych, na adres podany w formularzu.",
  },
];

// The Zasobnik now holds both the innovations and the materials, so it is the
// single place to send someone looking for an answer.
const SHORTCUTS = [
  {
    href: "/zasobnik",
    label: "Zasobnik wiedzy",
    text: "Raport o tym, co już działa, i klikany katalog innowacji i materiałów.",
    icon: BookOpen,
  },
  {
    href: "/kreator/grant",
    label: "Aktualne nabory",
    text: "Terminy, regulaminy i formularz wniosku.",
    icon: FileText,
  },
  {
    href: "/kreator/fiszka",
    label: "Zgłoś pomysł",
    text: "Jeśli Twoja sprawa to pomysł, a nie pytanie.",
    icon: Lightbulb,
  },
];

// The help bot hands off here with ?message=...&page=...
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; page?: string }>;
}) {
  const { message = "", page = "" } = await searchParams;
  const jar = await cookies();

  return (
    <div className="contact-page">
      <section className="contact-hero" aria-labelledby="kontakt-h">
        <div className="contact-hero__copy">
          <p className="eyebrow">Komunikacja z ROPS</p>
          <h1 id="kontakt-h">Napisz do pracownika ROPS</h1>
          <p>
            Kiedy strona nie odpowiada na Twoje pytanie, odpisze człowiek z
            zespołu Hubu.
          </p>
        </div>
        <dl className="contact-hero__facts">
          <div>
            <dt>Odpowiedź</dt>
            <dd>do 2 dni roboczych</dd>
          </div>
          <div>
            <dt>Sposób kontaktu</dt>
            <dd>e-mail, który podasz</dd>
          </div>
          <div>
            <dt>Z czym pisać</dt>
            <dd>nabory, pomysły, dostępność</dd>
          </div>
        </dl>
      </section>

      <div className="contact-layout">
        <div className="contact-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Formularz</p>
              <h2>Napisz wiadomość</h2>
              <p>Dwa kroki: dane kontaktowe i treść sprawy.</p>
            </div>
          </div>
          <ContactForm
            defaultName=""
            defaultEmail={jar.get("demo_email")?.value ?? ""}
            defaultMessage={message}
            defaultPage={page}
          />
        </div>

        <aside className="contact-aside" aria-label="Informacje o kontakcie">
          <section aria-labelledby="co-dalej-h" className="contact-card">
            <h2 id="co-dalej-h">Co się dzieje dalej</h2>
            <ol className="contact-steps">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span aria-hidden="true">{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="szybciej-h" className="contact-card">
            <h2 id="szybciej-h">Może znajdziesz szybciej</h2>
            <ul className="contact-shortcuts">
              {SHORTCUTS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <Icon aria-hidden="true" />
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.text}</small>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
