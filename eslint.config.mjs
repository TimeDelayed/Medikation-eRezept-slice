import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

export default [
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },

    plugins: {
      "@stylistic": stylistic,
    },

    rules: {
      // Code Quality
      eqeqeq: "error",
      curly: "error",
      "no-var": "error",
      "prefer-const": "warn",
      "no-unused-vars": "warn",
      "no-console": "off",

      // Formatting
      "@stylistic/indent": ["error", 2],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/brace-style": ["error", "1tbs"],
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/space-before-blocks": "error",
      "@stylistic/keyword-spacing": "error",
    },
  },
];
