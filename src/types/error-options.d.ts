/**
 * workaround for fabric 7.x types:
 * node_modules/fabric/dist/src/util/internals/console.d.ts references the
 * global `ErrorOptions` interface, which is only declared in TypeScript's
 * es2022 lib.
**/
interface ErrorOptions {
  cause?: unknown;
}
