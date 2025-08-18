import type {User} from './user.interface';

export interface CommentPayload {
  content: string | null;
  private?: boolean;
  relates_to_content_type_id?: number;
  relates_to_pk?: string;
}

export interface Comment {
  last_modified_at: string | null;
  content_type: number;
  last_modified_by: User;
  created_at: string | null;
  content_type_model: string;
  version_number: number;
  display: string;
  content: string;
  url: string;
  deleted: boolean;
  created_by: User;
  pk: string;
  is_favourite: boolean;
}
