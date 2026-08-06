/**
 * workaround for pdfjs-dist 6.2.108 type bug:
 * types/src/display/editor/stamp.d.ts references `ImageDataArray`, which is
 * never declared.
**/
type ImageDataArray = Uint8ClampedArray;
