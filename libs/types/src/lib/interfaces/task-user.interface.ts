import type {User} from './user.interface';

export type TaskUser = Exclude<User, 'available_storage_megabyte' | 'used_storage_megabyte' | 'permissions' | 'url'>;
