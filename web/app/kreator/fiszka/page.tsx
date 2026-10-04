import { Suspense } from "react";
import { FiszkaForm } from "../fiszka-form";

export default function FiszkaPage() {
  return (
    <Suspense fallback={<p>Wczytuję formularz…</p>}>
      <FiszkaForm kind="idea" />
    </Suspense>
  );
}
