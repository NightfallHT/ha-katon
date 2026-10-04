"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { innovations, materials } from "@/content/catalog";
import { categoryLabel, stageLabel } from "@/content/labels";

const STAGES = ["pomysł", "testowana", "wdrożona"];

const MATERIAL_TYPES = [
  { value: "raport", label: "Raport" },
  { value: "poradnik", label: "Poradnik" },
  { value: "film", label: "Film" },
  { value: "canvas", label: "Canvas" },
];

function plural(count: number, one: string, few: string, many: string) {
  if (count === 1) return one;
  const rest = count % 10;
  const teens = count % 100;
  if (rest >= 2 && rest <= 4 && (teens < 12 || teens > 14)) return few;
  return many;
}

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * The deterministic half of the Zasobnik: the same catalogue the report draws
 * on, but browsed by clicking filters instead of describing a problem in
 * words. Nothing here calls the model.
 */
export function CatalogBrowser() {
  const [tab, setTab] = useState<"innowacje" | "materialy">("innowacje");
  const [categories, setCategories] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const allCategories = useMemo(
    () =>
      Array.from(new Set(innovations.map((item) => item.category))).sort(
        (a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "pl"),
      ),
    [],
  );

  const filteredInnovations = useMemo(
    () =>
      innovations.filter((item) => {
        if (categories.length && !categories.includes(item.category)) return false;
        if (stages.length && !stages.includes(item.stage)) return false;
        return true;
      }),
    [categories, stages],
  );

  const filteredMaterials = useMemo(
    () =>
      types.length ? materials.filter((item) => types.includes(item.type)) : materials,
    [types],
  );

  const active =
    tab === "innowacje"
      ? categories.length + stages.length
      : types.length;

  function clearAll() {
    setCategories([]);
    setStages([]);
    setTypes([]);
  }

  const count =
    tab === "innowacje" ? filteredInnovations.length : filteredMaterials.length;

  return (
    <section className="catalog" aria-labelledby="catalog-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Bez pisania</p>
          <h2 id="catalog-title">Przeglądaj katalog</h2>
          <p>
            Ten sam zbiór, z którego powstaje raport — tylko klikany. Zaznacz
            filtry i zobacz listę.
          </p>
        </div>
      </div>

      <div className="catalog__tabs" role="group" aria-label="Co przeglądasz">
        <button
          type="button"
          aria-pressed={tab === "innowacje"}
          onClick={() => setTab("innowacje")}
        >
          Innowacje ({innovations.length})
        </button>
        <button
          type="button"
          aria-pressed={tab === "materialy"}
          onClick={() => setTab("materialy")}
        >
          Materiały ({materials.length})
        </button>
      </div>

      <div className="catalog__layout">
        <div className="catalog__filters">
          {tab === "innowacje" ? (
            <>
              <fieldset>
                <legend>Temat</legend>
                {allCategories.map((slug) => (
                  <label key={slug}>
                    <input
                      type="checkbox"
                      checked={categories.includes(slug)}
                      onChange={() => setCategories(toggle(categories, slug))}
                    />
                    <span>{categoryLabel(slug)}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <legend>Etap</legend>
                {STAGES.map((stage) => (
                  <label key={stage}>
                    <input
                      type="checkbox"
                      checked={stages.includes(stage)}
                      onChange={() => setStages(toggle(stages, stage))}
                    />
                    <span>{stageLabel(stage)}</span>
                  </label>
                ))}
              </fieldset>
            </>
          ) : (
            <fieldset>
              <legend>Rodzaj materiału</legend>
              {MATERIAL_TYPES.map((item) => (
                <label key={item.value}>
                  <input
                    type="checkbox"
                    checked={types.includes(item.value)}
                    onChange={() => setTypes(toggle(types, item.value))}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </fieldset>
          )}

          {active ? (
            <button type="button" className="secondary-action" onClick={clearAll}>
              Wyczyść filtry ({active})
            </button>
          ) : null}
        </div>

        <div>
          <p className="catalog__count" aria-live="polite">
            {tab === "innowacje"
              ? `${count} ${plural(count, "innowacja", "innowacje", "innowacji")}`
              : `${count} ${plural(count, "materiał", "materiały", "materiałów")}`}
          </p>

          {count === 0 ? (
            <p className="empty-result">
              Nic nie pasuje do tych filtrów. Odznacz któryś z nich.
            </p>
          ) : tab === "innowacje" ? (
            <ol className="result-title-list">
              {filteredInnovations.map((item, index) => (
                <li key={item.id}>
                  <span className="result-title-list__number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>
                      <Link href={`/biblioteka/${item.id}`}>{item.title}</Link>
                    </h3>
                    <p>{item.summary}</p>
                    <p className="catalog__meta">
                      {categoryLabel(item.category)} · {stageLabel(item.stage)}
                      {item.region ? ` · ${item.region}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="materials-block catalog__materials">
              <ul>
                {filteredMaterials.map((item) => (
                  <li key={item.title}>
                    <a href={item.url || "/zasobnik"}>
                      <span>{item.type}</span>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
