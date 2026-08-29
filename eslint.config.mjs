import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Packages the pure scoring domain must never depend on. */
const DOMAIN_FORBIDDEN = [
  { name: "react", message: "domain/ is framework-free — no React." },
  { name: "react-dom", message: "domain/ is framework-free — no React." },
  { name: "next", message: "domain/ is framework-free — no Next." },
  {
    name: "@prisma/client",
    message: "domain/ must not know about persistence — map at the infra boundary.",
  },
  { name: "dexie", message: "domain/ is framework-free — no Dexie." },
];

const DOMAIN_FORBIDDEN_PATTERNS = [
  {
    group: ["@supabase/*", "next/*", "@/app/*", "@/components/*", "@/features/*", "@/infrastructure/*"],
    message:
      "domain/ may only import from within domain/. Convert external shapes at the mapper boundary.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: DOMAIN_FORBIDDEN, patterns: DOMAIN_FORBIDDEN_PATTERNS },
      ],
      "no-restricted-globals": [
        "error",
        { name: "window", message: "domain/ must not touch the DOM." },
        { name: "document", message: "domain/ must not touch the DOM." },
        { name: "localStorage", message: "domain/ must be pure." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: "domain/ calculations must be deterministic — pass time in as an argument.",
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: "domain/ calculations must be deterministic — pass time in as an argument.",
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: "domain/ must be deterministic — no Math.random().",
        },
      ],
    },
  },

  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message: "UI code goes through features/ → repositories, never Prisma directly.",
            },
          ],
          patterns: [
            {
              group: ["@/infrastructure/prisma/*"],
              message: "UI code goes through features/, never infrastructure/prisma directly.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
