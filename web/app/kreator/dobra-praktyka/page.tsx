import { Suspense } from "react";
import { FiszkaWizard } from "../fiszka-wizard";

export default function DobraPraktykaPage() {
  return (
    <Suspense fallback={<p>Wczytuję formularz…</p>}>
      <FiszkaWizard kind="good_practice" />
    </Suspense>
  );
}
