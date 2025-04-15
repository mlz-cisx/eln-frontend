export type ContentTypeModels =
  | 'dmp.dmp'
  | 'labbooks.labbook'
  | 'labbooks.labbooksection'
  | 'shared_elements.contact'
  | 'shared_elements.file'
  | 'shared_elements.meeting'
  | 'shared_elements.note'
  | 'shared_elements.task'
  | 'projects.project'
  | 'projects.projectroleuserassignment'
  | 'projects.resource'
  | 'pictures.picture'
  | 'plugins.plugininstance'
  | 'kanban_boards.kanbanboard'
  | 'drives.drive'
  | 'dss.dsscontainer';

export interface ContentTypeModelItem {
  modelName: string;
  routerBaseLink: string | null;
  translation: string;
  translationPlural: string;
  icon: string;
}
