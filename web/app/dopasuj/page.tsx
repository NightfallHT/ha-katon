import { Suspense } from "react";
import { DopasujClient } from "./dopasuj-client";

export default function DopasujPage() {
  return (
    <Suspense fallback={<p>Wczytuję wyszukiwanie…</p>}>
      <DopasujClient />
    </Suspense>
  );
}
