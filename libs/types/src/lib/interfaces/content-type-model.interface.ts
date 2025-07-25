export type ContentTypeModels =
  | 'labbooks.labbook'
  | 'shared_elements.file'
  | 'shared_elements.note'
  | 'pictures.picture'


export interface ContentTypeModelItem {
  modelName: string;
  routerBaseLink: string | null;
  translation: string;
  translationPlural: string;
  icon: string;
}
