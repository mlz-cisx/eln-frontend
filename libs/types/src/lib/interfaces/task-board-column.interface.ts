import type {KanbanTask} from './task.interface';

export interface TaskBoardColumn {
  color?: string;
  content_type?: number;
  content_type_model?: string;
  display?: string;
  icon: string;
  ordering: number;
  pk?: string;
  title: string;
  // Custom
  tasks?: KanbanTask[];
}
