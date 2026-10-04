import { Suspense } from "react";
import { FiszkaForm } from "../fiszka-form";

export default function DobraPraktykaPage() {
  return (
    <Suspense fallback={<p>Wczytuję formularz…</p>}>
      <FiszkaForm kind="good_practice" />
    </Suspense>
  );
}
