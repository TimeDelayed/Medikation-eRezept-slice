import js from "@eslint/js";
export default [
  js.configs.recommended,

  {
    rules: {
      eqeqeq: "error",
      curly: "error",
      "no-var": "error",
      "prefer-const": "warn",
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];