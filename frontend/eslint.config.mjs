import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

const eslintConfig = defineConfig([
  {
    // Base configuration
    ignores: [
      ".next/",
      "out/",
      "build/**",
      "next-env.d.ts",
      "node_modules/"
    ]
  },
  ...next,
]);

export default eslintConfig;