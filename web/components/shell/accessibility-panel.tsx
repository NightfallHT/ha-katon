"use client";

import { useEffect, useState } from "react";

const FONT_OPTIONS = [
  { value: "", label: "A", description: "Tekst standardowy", className: "wcag-panel__font--100" },
  { value: "125", label: "A+", description: "Tekst większy", className: "wcag-panel__font--125" },
  { value: "150", label: "A++", description: "Tekst bardzo duży", className: "wcag-panel__font--150" },
  { value: "175", label: "A+++", description: "Tekst największy", className: "wcag-panel__font--175" },
] as const;

export function AccessibilityPanel() {
  const [font, setFont] = useState("");
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setFont(localStorage.getItem("font") ?? "");
        setHighContrast(localStorage.getItem("contrast") === "high");
      } catch {
        // Local storage is optional. Controls still work for the current visit.
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function applyFont(value: string) {
    setFont(value);
    if (value) document.documentElement.setAttribute("data-font", value);
    else document.documentElement.removeAttribute("data-font");
    try {
      if (value) localStorage.setItem("font", value);
      else localStorage.removeItem("font");
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  function applyContrast(next: boolean) {
    setHighContrast(next);
    if (next) document.documentElement.setAttribute("data-contrast", "high");
    else document.documentElement.removeAttribute("data-contrast");
    try {
      if (next) localStorage.setItem("contrast", "high");
      else localStorage.removeItem("contrast");
    } catch {
      // Ignore private-mode storage failures.
    }
  }

  return (
    <aside className="wcag-panel" aria-label="Ułatwienia dostępu">
      <span className="wcag-panel__title">Widok strony</span>
      <div className="wcag-panel__fonts" aria-label="Wielkość tekstu">
        {FONT_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={`wcag-panel__font ${option.className}`}
            aria-label={option.description}
            aria-pressed={font === option.value}
            title={option.description}
            onClick={() => applyFont(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="wcag-panel__contrast"
        aria-pressed={highContrast}
        onClick={() => applyContrast(!highContrast)}
      >
        <span className="wcag-panel__contrast-icon" aria-hidden="true">
          <span />
          <span />
        </span>
        <span>{highContrast ? "Zwykły kontrast" : "Wysoki kontrast"}</span>
      </button>
    </aside>
  );
}
