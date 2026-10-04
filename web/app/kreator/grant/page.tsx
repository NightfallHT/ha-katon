import Link from "next/link";
import { calls } from "@/content/catalog";

export const metadata = {
  title: "Aktualne nabory — Hub Innowacji Społecznych",
};

function deadlineLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(date);
}

export default function NaboryPage() {
  const open = calls.filter((item) => item.is_open);
  const closed = calls.filter((item) => !item.is_open);

  return (
    <div className="calls-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Granty</p>
          <h1>Aktualne nabory</h1>
          <p>
            Tu zbieramy nabory, w których możesz złożyć wniosek. Przy każdym
            znajdziesz opis, formularz wniosku i regulamin.
          </p>
        </div>
      </div>

      {open.length ? (
        <ul className="calls-list">
          {open.map((call) => (
            <li key={call.name}>
              {/* A list even with one call, so adding the next needs no redesign. */}
              <article className="call-card">
                <p className="call-card__badge">Nabór otwarty</p>
                <h2>{call.name}</h2>
                <p className="call-card__text">{call.description}</p>

                <dl className="call-card__facts">
                  <div>
                    <dt>Wnioski można składać do</dt>
                    <dd>{deadlineLabel(call.deadline)}</dd>
                  </div>
                  <div>
                    <dt>Maksymalna kwota</dt>
                    <dd>{call.budget_max.toLocaleString("pl-PL")} zł</dd>
                  </div>
                </dl>

                <div className="call-card__actions">
                  <Link
                    href={`/kreator/grant/wniosek?nabor=${encodeURIComponent(call.name)}`}
                    className="admin-primary-action"
                  >
                    Wniosek
                  </Link>
                  <a href={call.regulamin_url} className="secondary-action">
                    Regulamin
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-result">
          Nabór jest obecnie zamknięty.
          {closed[0] ? ` Następny termin: ${deadlineLabel(closed[0].deadline)}.` : ""}
        </p>
      )}

      {open.length && closed.length ? (
        <section aria-labelledby="zamkniete-h" className="calls-closed">
          <h2 id="zamkniete-h">Nabory zamknięte</h2>
          <ul>
            {closed.map((call) => (
              <li key={call.name}>
                <strong>{call.name}</strong> — termin minął {deadlineLabel(call.deadline)}.
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
