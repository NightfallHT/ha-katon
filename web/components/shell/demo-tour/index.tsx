"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { STEPS } from "./script";
import { Cancelled, holdForKey, holdForTime, runStep } from "./runner";

export type TourMode = "auto" | "manual";

/**
 * Latch, not a live read. The first step navigates away from the URL that
 * carried the parameter, so re-reading the address bar on every render would
 * see it vanish and tear the run down one step in. Once armed it stays armed
 * for the rest of the page load.
 *
 *   ?nagranie         timed, fits two minutes, for an unattended recording
 *   ?nagranie-manual  same steps, each one held until the right arrow — for
 *                     narrating over it live, where a timer would fight you
 */
let armed: TourMode | null = null;

function isArmed(): TourMode | null {
  if (!armed && typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.has("nagranie-manual")) armed = "manual";
    else if (params.has("nagranie")) armed = "auto";
  }
  return armed;
}

const noop = () => () => {};

/**
 * Guided walkthrough for the pitch recording. Add ?nagranie to any URL and the
 * site presents itself: it drives the real pages — the same clicks a person
 * would make — and captions what is happening from the three perspectives the
 * brief is judged on: resident, institution, ROPS.
 *
 * Mounted in the root layout, so navigating between steps does not unmount it.
 */
export function DemoTour() {
  const router = useRouter();
  const pathname = usePathname();
  // Server renders nothing; the client arms it after hydration.
  const mode = useSyncExternalStore(noop, isArmed, () => null);

  const [stopped, setStopped] = useState(false);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStopped(true);
  }, []);

  useEffect(() => {
    const started = isArmed();
    if (!started) return;
    const hold = started === "manual" ? holdForKey : holdForTime;

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    void (async () => {
      try {
        for (let i = 0; i < STEPS.length; i += 1) {
          if (signal.aborted) return;
          setIndex(i);
          await runStep(STEPS[i], signal, (href) => router.push(href), hold);
        }
        setDone(true);
      } catch (error) {
        // Aborting is how the run ends early; anything else is a real fault.
        if (!(error instanceof Cancelled)) throw error;
      }
    })();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        controller.abort();
        setStopped(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      controller.abort();
      window.removeEventListener("keydown", onKey);
    };
    // Mount only: the run owns its lifetime from here, and router is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mode || stopped) return null;

  const step = STEPS[Math.min(index, STEPS.length - 1)];
  const progress = done ? 100 : ((index + 1) / STEPS.length) * 100;

  return (
    <aside className="tour" aria-label="Prezentacja platformy">
      <div className="tour__bar" aria-hidden="true">
        <span className="tour__bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="tour__panel">
        <p className="tour__meta">
          <span className={`tour__role tour__role--${roleSlug(step.perspective)}`}>
            {step.perspective}
          </span>
          <span className="tour__count">
            {Math.min(index + 1, STEPS.length)} / {STEPS.length}
          </span>
          <span className="tour__path">{pathname}</span>
        </p>

        {/* One live region for the whole run: each caption replaces the last, so
            a screen reader hears the narration instead of the page churn. */}
        <p className="tour__caption" aria-live="polite" key={index}>
          {done
            ? "Mieszkaniec znajduje pomoc, gmina zamienia pomysł w usługę, ROPS widzi całość. Koniec prezentacji."
            : step.caption}
        </p>

        <p className="tour__hint">
          {done
            ? null
            : mode === "manual"
              ? "Strzałka w prawo — następny krok."
              : null}
        </p>

        <button type="button" className="tour__stop" onClick={stop}>
          {done ? "Zamknij" : "Zakończ prezentację (Esc)"}
        </button>
      </div>
    </aside>
  );
}

function roleSlug(perspective: string) {
  if (perspective === "Instytucja") return "instytucja";
  if (perspective === "ROPS") return "rops";
  return "mieszkaniec";
}
