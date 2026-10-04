import { STATUS_LABELS, label } from "./labels";

// New work is the one thing a ROPS worker scans for, so it gets the filled
// badge; the rest are outlined. Colour never carries the meaning on its own —
// the label is always written out (WCAG 1.4.1).
const TONE: Record<string, string> = {
  nowe: "admin-badge--new",
  w_ocenie: "admin-badge--review",
  zaakceptowane: "admin-badge--yes",
  odrzucone: "admin-badge--no",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE[status] ?? "";
  return (
    <span className={tone ? `admin-badge ${tone}` : "admin-badge"}>
      {label(STATUS_LABELS, status)}
    </span>
  );
}

export function VisibilityBadge({ published }: { published: boolean }) {
  return (
    <span className={`admin-badge ${published ? "admin-badge--yes" : "admin-badge--no"}`}>
      {published ? "Opublikowana" : "Ukryta"}
    </span>
  );
}

export function OpenBadge({ open }: { open: boolean }) {
  return (
    <span className={`admin-badge ${open ? "admin-badge--yes" : "admin-badge--no"}`}>
      {open ? "Nabór otwarty" : "Nabór zamknięty"}
    </span>
  );
}
