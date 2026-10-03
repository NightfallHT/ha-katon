import { cookies } from "next/headers";
import { ContactForm } from "./form";

export const metadata = { title: "Kontakt | Hub Innowacji Społecznych" };

// The help bot hands off here with ?message=...&page=...
export default async function ContactPage({ searchParams }: { searchParams: Promise<{ message?: string; page?: string }> }) {
  const { message = "", page = "" } = await searchParams;
  const jar = await cookies();
  return (
    <section aria-labelledby="kontakt-h">
      <h1 id="kontakt-h" className="text-3xl font-semibold">Napisz do pracownika ROPS</h1>
      <p className="mt-3 max-w-prose">
        Masz pytanie albo potrzebujesz pomocy? Wypełnij formularz. Odpowiemy w ciągu 2 dni roboczych.
      </p>
      <ContactForm defaultName="" defaultEmail={jar.get("demo_email")?.value ?? ""} defaultMessage={message} defaultPage={page} />
    </section>
  );
}
