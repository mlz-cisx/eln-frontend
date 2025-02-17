import type {Metadata} from './metadata.interface';
import type {User} from './user.interface';
import {Privileges} from "./privileges.interface";

export interface LabBookPayload {
  title: string;
  projects: string[];
  description?: string;
  strict_mode: boolean;
  metadata?: Metadata[];
}

export interface LabBookChildElement {
  type: string;
  content_type: string;
  display_name: string;
  version_number: number;
  viewable: boolean;
}


export interface LabBook {
  title: string;
  deleted: boolean;
  strict_mode: boolean;
  created_at: string;
  last_modified_by: User;
  last_modified_at: string;
  metadata: Metadata[];
  display: string;
  projects: string[];
  description: string;
  created_by: User;
  url: string;
  pk: string;
  version_number: number;
  is_template: boolean;
  content_type: number;
  content_type_model: string;
  child_elements?: LabBookChildElement[];
  is_favourite: boolean;
}

export interface Lab_Book {
  labbook: LabBook,
  privileges: Privileges
}

