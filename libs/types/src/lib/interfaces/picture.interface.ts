import type {User} from './user.interface';
import {Privileges} from "./privileges.interface";

export interface PicturePayload {
  title: string;
  canvas_content?: Blob | string | null;
  origin?: string;
}

export interface SketchPayload {
  title: string;
  canvas_content?: Blob | string | null;
}


export interface PictureClonePayload {
  background_image: Blob;
  info: Blob | null;
}

export interface Picture {
  container_id: string | null;
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  deleted: boolean;
  description: string;
  display: string;
  download_background_image?: string;
  canvas_content?: string;
  last_modified_at: string;
  last_modified_by: User;
  pk: string;
  title: string;
  url: string;
  version_number: number;
  is_favourite: boolean;
}

export interface PictureContent {
  canvas_content: string;
}

export interface Pic_with_privileges {
  picture: Picture,
  privileges: Privileges
}

