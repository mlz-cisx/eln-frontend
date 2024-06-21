export type ProjectSidebarModels =
  | 'sidebar.overview'
  | 'sidebar.tasks'
  | 'sidebar.taskboards'
  | 'sidebar.contacts'
  | 'sidebar.calendar'
  | 'sidebar.appointments'
  | 'sidebar.resources'
  | 'sidebar.labbooks'
  | 'sidebar.files'
  | 'sidebar.pictures'
  | 'sidebar.storages'
  | 'sidebar.dmps';

export interface ProjectSidebarModelItem {
  modelName: string;
  icon: string;
  name: string;
  routerBaseLink: string;
}
