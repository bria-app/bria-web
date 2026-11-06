// ESLint flat config for Next 16 (`next lint` no longer exists; see audit M-11).
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layers (docs/DESIGN.md §7): app → features (and the layout shell) → components → hooks → services → lib/types.
// A layer may import the ones to its right, never the ones to its left.
const layer = (files, banned) => ({
  files,
  rules: {
    "no-restricted-imports": [
      "error",
      { patterns: [{ group: banned.map((l) => `@/${l}/**`), message: `Capas: ${files[0]} no puede importar de ${banned.join(", ")}.` }] },
    ],
  },
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  layer(["src/features/**", "src/components/layout/**"], ["app"]),
  layer(["src/components/ui/**", "src/components/brand/**", "src/components/charts/**"], ["app", "features", "services"]),
  layer(["src/hooks/**"], ["app", "features", "components"]),
  layer(["src/services/**"], ["app", "features", "components", "hooks"]),
  layer(["src/lib/**", "src/types/**"], ["app", "features", "components", "hooks", "services"]),
  globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts", "public/**"]),
]);
