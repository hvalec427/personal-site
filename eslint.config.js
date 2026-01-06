export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.min.js",
      "eslint.config.js",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        console: "readonly",
        toggleTheme: "readonly",
        randomTheme: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": ["error", { allow: ["info", "error", "warn"] }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];
