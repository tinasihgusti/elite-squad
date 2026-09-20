import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * ESLint 9 flat config (Next.js 16 tidak lagi menyediakan `next lint`).
 * Dijalankan lewat `npm run lint` → `eslint .`
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // Server Action menerima state sebelumnya sebagai argumen pertama.
      // Sebagian action tidak memakainya, tapi argumennya tetap wajib ada
      // agar posisi `formData` benar — jadi awalan `_` menandainya sengaja.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
