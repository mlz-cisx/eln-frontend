import {mockDMP} from './dmp';
import type {Dashboard} from '@joeseln/types';
import {mockContact} from './contact';
import {mockFile} from './file';
import {mockProject} from './project';
import {mockResource} from './resource';
import {mockKanbanTask} from './task';

export const mockDashboard: Dashboard = {
  contacts: [mockContact],
  dmps: [mockDMP],
  files: [mockFile],
  projects: [mockProject],
  resources: [mockResource],
  tasks: [mockKanbanTask],
};
