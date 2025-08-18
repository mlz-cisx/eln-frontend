import type {User} from './user.interface';
import {Privileges} from "./privileges.interface";

export interface NotePayload {
  subject: string;
  content: string | null;
}

export interface Note {
  last_modified_at: string | null;
  content_type: number;
  last_modified_by: User;
  created_at: string | null;
  content_type_model: string;
  subject: string;
  version_number: number;
  display: string;
  content: string;
  url: string;
  deleted: boolean;
  created_by: User;
  pk: string;
  is_favourite: boolean;
  position_y: number;
  labbook_id: string;
}

export interface Note_with_privileges {
  note: Note,
  privileges: Privileges
}
