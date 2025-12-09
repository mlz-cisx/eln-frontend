const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const globals = require("globals");
const htmlEslint = require("@html-eslint/eslint-plugin");
const babelParser = require("@babel/eslint-parser");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const parser = require("@html-eslint/parser");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },
    },

    extends: compat.extends("eslint:recommended", "plugin:prettier/recommended", "plugin:diff/diff"),

    rules: {
        "prettier/prettier": 0,
    },

    plugins: {
        "@html-eslint": htmlEslint,
    },
}, globalIgnores(["!**/.*.js", "**/dist", "**/node_modules"]), {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
        parser: babelParser,
        sourceType: "module",

        parserOptions: {
            requireConfigFile: false,
            allowImportExportEverywhere: false,

            ecmaFeatures: {
                globalReturn: false,
            },
        },
    },
}, {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
        parser: tsParser,

        parserOptions: {
            project: ["./tsconfig.json"],
        },
    },

    extends: compat.extends(
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },
}, {
    files: ["**/*.html"],

    languageOptions: {
        parser: parser,
    },

    extends: compat.extends("plugin:@html-eslint/recommended"),

    rules: {
        "@html-eslint/indent": ["error", 2],
    },
}]);
