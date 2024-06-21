import type {User} from '@joeseln/types';

export interface SearchResult {
  content_type_model: string;
  display: string;
  created_by: User;
}
