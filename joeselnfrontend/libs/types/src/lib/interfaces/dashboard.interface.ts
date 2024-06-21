import type {Contact} from './contact.interface';
import type {DMP} from './dmp.interface';
import type {File} from './file.interface';
import type {Project} from './project.interface';
import type {Resource} from './resource.interface';
import type {KanbanTask} from './task.interface';

export interface Dashboard {
  contacts: Contact[];
  dmps: DMP[];
  files: File[];
  projects: Project[];
  resources: Resource[];
  tasks: KanbanTask[];
}
