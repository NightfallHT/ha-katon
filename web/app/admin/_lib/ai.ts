// Server-side helper: ask the AI service to recompute embeddings so edits are matchable at once.
export async function reembed(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_AI_URL;
  if (!url) return false;
  try {
    const res = await fetch(`${url}/admin/reembed`, { method: "POST", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
