import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // WCAG 2.1 AA is 20% of the score (AGENTS.md §1), and eslint-config-next only
  // enables a handful of jsx-a11y rules. Turn on the full recommended set.
  // Rules only — eslint-config-next already registers the "jsx-a11y" plugin and
  // registering it twice is a hard ESLint error.
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored shadcn primitives — we theme them, we don't lint upstream code.
    "components/ui/**",
  ]),
]);

export default eslintConfig;
