import { getCalls, openCalls } from "@/lib/calls";
import { GrantForm } from "./grant-form";

// Re-read the calls table every 60 s; saving in /admin/nabory revalidates immediately.
export const revalidate = 60;

export default async function GrantPage({ searchParams }: PageProps<"/kreator/grant/wniosek">) {
  const { nabor } = await searchParams;
  const open = openCalls(await getCalls());
  // ?nabor=<name> picks a specific open call; otherwise the soonest one.
  const call = open.find((c) => c.name === nabor) ?? open[0] ?? null;
  return <GrantForm key={call?.name ?? "none"} call={call} />;
}
