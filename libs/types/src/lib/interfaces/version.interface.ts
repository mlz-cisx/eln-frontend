import type {User} from './user.interface';

export interface Version {
  content_type?: number;
  content_type_model?: string;
  content_type_pk?: number;
  created_at?: string;
  created_by?: User;
  display?: string;
  last_modified_at?: string;
  last_modified_by?: User;
  metadata: any;
  number?: number;
  object_id?: string;
  pk?: string;
  summary?: string;
}

export interface FinalizeVersion {
  summary: string;
}
