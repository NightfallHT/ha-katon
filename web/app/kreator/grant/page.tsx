import Link from "next/link";
import {
  budgetLabel,
  deadlineLabel,
  getCalls,
  openCalls,
  pastCalls,
  upcomingCalls,
} from "@/lib/calls";

export const metadata = {
  title: "Aktualne nabory — Hub Innowacji Społecznych",
};

// Re-read the calls table every 60 s; saving in /admin/nabory revalidates immediately.
export const revalidate = 60;

export default async function NaboryPage() {
  const calls = await getCalls();
  const open = openCalls(calls);
  const upcoming = upcomingCalls(calls);
  const past = pastCalls(calls);

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
                    <dd>{budgetLabel(call.budget_max)}</dd>
                  </div>
                </dl>

                <div className="call-card__actions">
                  <Link
                    href={`/kreator/grant/wniosek?nabor=${encodeURIComponent(call.name)}`}
                    className="admin-primary-action"
                  >
                    Wniosek
                  </Link>
                  {call.regulamin_url ? (
                    <a href={call.regulamin_url} className="secondary-action">
                      Regulamin
                    </a>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-result">
          Nabór jest obecnie zamknięty.
          {upcoming[0] ? ` Następny nabór: ${upcoming[0].name}, termin ${deadlineLabel(upcoming[0].deadline)}.` : ""}
        </p>
      )}

      {upcoming.length ? (
        <section aria-labelledby="planowane-h" className="calls-closed">
          <h2 id="planowane-h">Nabory planowane</h2>
          <ul>
            {upcoming.map((call) => (
              <li key={call.name}>
                <strong>{call.name}</strong> — termin {deadlineLabel(call.deadline)}.
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {past.length ? (
        <section aria-labelledby="zamkniete-h" className="calls-closed">
          <h2 id="zamkniete-h">Nabory zakończone</h2>
          <ul>
            {past.map((call) => (
              <li key={call.name}>
                <strong>{call.name}</strong> —{" "}
                {call.deadline ? `termin minął ${deadlineLabel(call.deadline)}` : "nabór zakończony"}.
                {call.regulamin_url ? (
                  <>
                    {" "}
                    <a href={call.regulamin_url}>Regulamin</a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
