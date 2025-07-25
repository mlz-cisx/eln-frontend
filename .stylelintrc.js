module.exports = {
  plugins: ["stylelint-prettier"],
  extends: ["stylelint-config-standard-scss"],
  rules: {
    "prettier/prettier": true,
    "scss/load-no-partial-leading-underscore": null,
    "font-family-no-missing-generic-family-keyword": null,
    "selector-pseudo-element-no-unknown": [
      true,
      { ignorePseudoElements: ["ng-deep"] },
    ],
    "selector-type-no-unknown": [
      true,
      {
        ignore: ["custom-elements"],
        ignoreTypes: ["gridster", "gridster-item"],
      },
    ],
  },
};
