export interface SaveSketchEvent {
  file: globalThis.File | Blob | string;
  shapes: Blob | string;
}
