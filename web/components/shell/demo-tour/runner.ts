/**
 * Drives the page for the recorded walkthrough.
 *
 * Everything here talks to the real DOM the same way a person would — the tour
 * must not get its own code paths, or it would demonstrate something the app
 * does not actually do.
 */

import type { Step } from "./script";

export const CANCELLED = Symbol("tour cancelled");

export class Cancelled extends Error {
  constructor() {
    super("tour cancelled");
    this.name = "Cancelled";
  }
}

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Cancelled());
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new Cancelled());
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Waits for a selector. Returns null instead of hanging if the page never shows
 * it: a renamed class should cost one dull step, not the rest of the recording.
 * 12 s is above the slowest model call measured against the live service (~5 s).
 */
export async function waitFor(
  selector: string,
  signal: AbortSignal,
  timeoutMs = 12_000,
): Promise<Element | null> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const found = document.querySelector(selector);
    if (found) return found;
    if (Date.now() > deadline) return null;
    await sleep(120, signal);
  }
}

function buttonWithText(text: string): HTMLElement | null {
  const needle = text.trim().toLowerCase();
  const candidates = document.querySelectorAll<HTMLElement>("button, a[href]");
  for (const node of candidates) {
    if ((node.textContent ?? "").trim().toLowerCase().includes(needle)) return node;
  }
  return null;
}

/**
 * React keeps its own copy of an input's value, so assigning `.value` is
 * invisible to it. Going through the prototype setter and firing the event
 * React listens for is the supported way to drive a controlled field.
 */
function setReactValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export async function typeInto(
  selector: string,
  text: string,
  signal: AbortSignal,
  perCharMs: number,
) {
  const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!field) return;
  field.focus();
  setReactValue(field, "");
  for (let i = 1; i <= text.length; i += 1) {
    setReactValue(field, text.slice(0, i));
    await sleep(perCharMs, signal);
  }
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

export function fillNow(selector: string, value: string) {
  const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!field) return;
  setReactValue(field, value);
}

/** Puts a ring on the thing about to be clicked, so the recording shows what moved. */
async function highlight(element: Element, signal: AbortSignal) {
  element.classList.add("tour-highlight");
  try {
    await sleep(450, signal);
  } finally {
    element.classList.remove("tour-highlight");
  }
}

export async function clickSelector(selector: string, signal: AbortSignal) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return false;
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await highlight(element, signal);
  element.click();
  return true;
}

export async function clickText(text: string, signal: AbortSignal) {
  const element = buttonWithText(text);
  if (!element) return false;
  element.scrollIntoView({ block: "center", behavior: "smooth" });
  await highlight(element, signal);
  element.click();
  return true;
}

export function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ block: "center", behavior: "smooth" });
}

/**
 * Runs one step. `navigate` is the caller's router.push, so the tour uses
 * client-side navigation and this component (mounted in the layout) survives.
 *
 * `hold` decides when the step ends: a timer in the recorded mode, a key press
 * in the manual one. Everything before it is identical, so the manual run shows
 * exactly the same screens.
 */
export async function runStep(
  step: Step,
  signal: AbortSignal,
  navigate: (href: string) => void,
  hold: (remainingMs: number, signal: AbortSignal) => Promise<void>,
) {
  const started = Date.now();

  if (step.go && new URL(window.location.href).pathname !== step.go) {
    navigate(step.go);
    await sleep(350, signal);
  }
  // A precondition: the thing this step is about to act on.
  if (step.waitFor) await waitFor(step.waitFor, signal);
  if (step.scrollTo) scrollTo(step.scrollTo);
  if (step.fill) {
    for (const item of step.fill) {
      fillNow(item.selector, item.value);
      await sleep(180, signal);
    }
  }
  if (step.type) {
    // Fast enough to fit the budget, slow enough to read on the recording.
    await typeInto(step.type.selector, step.type.text, signal, 28);
  }
  if (step.click) {
    for (const selector of step.click) {
      await clickSelector(selector, signal);
      await sleep(260, signal);
    }
  }
  if (step.clickText) {
    for (const text of step.clickText) {
      await clickText(text, signal);
      await sleep(260, signal);
    }
  }
  // A result: what this step's own clicks produce. Waiting for it here instead
  // of up front is the difference between 3 s and a 12 s timeout.
  if (step.until) await waitFor(step.until, signal);

  // The declared duration counts from the start of the step, so time spent
  // typing or waiting for the model is not added on top of it.
  await hold(step.ms - (Date.now() - started), signal);
}

/** Recorded mode: sit on the caption for the rest of its declared time. */
export function holdForTime(remainingMs: number, signal: AbortSignal) {
  return remainingMs > 0 ? sleep(remainingMs, signal) : Promise.resolve();
}

/** Manual mode: wait for the right arrow (or space), however long that takes. */
export function holdForKey(_remainingMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Cancelled());
    function onKey(event: KeyboardEvent) {
      if (event.key !== "ArrowRight" && event.key !== " " && event.key !== "Enter") return;
      // So pressing space in a field the tour just typed into does not advance.
      const target = event.target as HTMLElement | null;
      if (event.key !== "ArrowRight" && target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) {
        return;
      }
      event.preventDefault();
      cleanup();
      resolve();
    }
    function onAbort() {
      cleanup();
      reject(new Cancelled());
    }
    function cleanup() {
      window.removeEventListener("keydown", onKey);
      signal.removeEventListener("abort", onAbort);
    }
    window.addEventListener("keydown", onKey);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
