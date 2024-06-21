export type MenuModels =
  | 'menu.dashboard'
  | 'menu.appointments'
  | 'menu.calendar'
  | 'menu.contacts'
  | 'menu.files'
  | 'menu.labbooks'
  | 'menu.pictures'
  | 'menu.plugin-data'
  | 'menu.projects'
  | 'menu.resources'
  | 'menu.storages'
  | 'menu.taskboards'
  | 'menu.tasks'
  | 'menu.dmps';

export interface MenuModelItem {
  modelName: string;
  name: string;
  routerLink: string;
  routerLinkExactMatch: boolean;
}
