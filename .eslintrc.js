// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "plugin:@tanstack/query/recommended"],
  ignorePatterns: ["/dist/*"],
  plugins: ["import"],
  rules: {
    "import/no-unresolved": "error",
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./",
      },
    },
  },
};
