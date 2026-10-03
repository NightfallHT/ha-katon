import { Suspense } from "react";
import { FiszkaWizard } from "../fiszka-wizard";

export default function FiszkaPage() {
  return (
    <Suspense fallback={<p>Wczytuję formularz…</p>}>
      <FiszkaWizard kind="idea" />
    </Suspense>
  );
}
