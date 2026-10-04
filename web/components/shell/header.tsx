import Link from "next/link";

// Brand only: the menu links and the role switcher are gone, so the header
// needs no state and stays a server component.
export function Header() {
  return (
    <header className="site-header">
      {/* Top padding leaves room for the fixed accessibility panel until it
          moves beside the header on large screens. */}
      {/* items-start keeps the link as wide as its text — stretched, it would
          put an invisible click target under the accessibility panel. */}
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-5 pb-5 pt-28 md:px-8 md:pt-5 lg:pr-[22rem]">
        <Link href="/" className="font-bold no-underline">
          <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Małopolska
          </span>
          Hub Innowacji Społecznych
        </Link>
      </div>
    </header>
  );
}
