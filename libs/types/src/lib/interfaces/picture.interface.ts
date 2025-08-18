import type {User} from './user.interface';
import {Privileges} from "./privileges.interface";

export interface PicturePayload {
  title: string;
  height: number;
  width: number;
  aspectRatio: number;
  background_image: globalThis.File | Blob | string | null;
}

export interface SketchPayload {
  title: string;
  height: number;
  width: number;
  rendered_image: globalThis.File | Blob | string;
  shapes_image?: globalThis.File | Blob | string | null;
}

export interface ConvertTiffPayload {
  file: Blob;
}

export interface PictureEditorPayload {
  background_image: Blob;
  shapes_image: Blob;
  width: number;
  height: number;
  rendered_image: Blob;
  scale: number
}

export interface PictureClonePayload {
  background_image: Blob;
  shapes_image: Blob;
  rendered_image: Blob;
  info: string | null;
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
  download_background_image: string;
  download_rendered_image: string;
  download_shapes: string;
  height: number;
  width: number;
  scale: number;
  last_modified_at: string;
  last_modified_by: User;
  pk: string;
  title: string;
  url: string;
  version_number: number;
  is_favourite: boolean;
}

export interface Pic_with_privileges {
  picture: Picture,
  privileges: Privileges
}

