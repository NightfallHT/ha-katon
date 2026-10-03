"use client";

import { useActionState } from "react";
import { CATEGORY_LABELS } from "../../_lib/labels";
import { saveInnovation } from "./actions";

type Inn = { id: string; title: string; summary: string; description: string | null; category: string; tags: string[] | null; video_url: string | null; published: boolean };
const field = "mt-1 w-full rounded-md border p-3";

export function EditForm({ inn }: { inn: Inn }) {
  const [state, action, pending] = useActionState(saveInnovation.bind(null, inn.id), null);
  return (
    <form action={action} className="mt-6 max-w-2xl space-y-4">
      <div>
        <label htmlFor="e-title" className="block font-medium">Tytuł <span className="font-normal">(wymagane)</span></label>
        <input id="e-title" name="title" required defaultValue={inn.title} className={field} />
      </div>
      <div>
        <label htmlFor="e-summary" className="block font-medium">Krótki opis, 1 do 2 zdań <span className="font-normal">(wymagane)</span></label>
        <textarea id="e-summary" name="summary" required rows={3} defaultValue={inn.summary} className={field} />
      </div>
      <div>
        <label htmlFor="e-desc" className="block font-medium">Pełny opis</label>
        <textarea id="e-desc" name="description" rows={6} defaultValue={inn.description ?? ""} className={field} />
      </div>
      <div>
        <label htmlFor="e-cat" className="block font-medium">Kategoria</label>
        <select id="e-cat" name="category" defaultValue={inn.category} className="mt-1 min-h-11 rounded-md border px-3">
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="e-tags" className="block font-medium">Tagi, rozdzielone przecinkami</label>
        <input id="e-tags" name="tags" defaultValue={(inn.tags ?? []).join(", ")} className={field} />
      </div>
      <div>
        <label htmlFor="e-video" className="block font-medium">Adres filmu</label>
        <input id="e-video" name="video_url" type="url" defaultValue={inn.video_url ?? ""} className={field} />
      </div>
      <div className="flex min-h-11 items-center gap-2">
        <input id="e-pub" name="published" type="checkbox" defaultChecked={inn.published} className="size-5" />
        <label htmlFor="e-pub" className="font-medium">Opublikowana w Bibliotece</label>
      </div>
      <button type="submit" disabled={pending} className="min-h-11 rounded-md border px-5 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">Zapisz zmiany</button>
      <p role="status" aria-live="polite">{pending ? "Zapisuję i odświeżam dopasowania…" : state?.message}</p>
    </form>
  );
}
