import type {User} from './user.interface';

export interface Label {
  color: string;
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  display: string;
  font_color: string;
  last_modified_at: string;
  last_modified_by: User;
  name: string;
  pk: string;
}

export interface LabelPayload {
  name?: string;
  color: string;
}
