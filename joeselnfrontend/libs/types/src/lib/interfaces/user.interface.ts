export interface UserProfile {
  academic_title: string;
  additional_information: string;
  anonymized?: boolean;
  avatar?: string;
  country: string;
  email_others?: string[] | null;
  first_name?: string;
  last_name?: string;
  org_zug_mitarbeiter?: string[] | null;
  org_zug_mitarbeiter_lang: string[] | null;
  org_zug_student?: string[] | null;
  org_zug_student_lang: string[] | null;
  phone: string;
  salutation?: string;
  title_post?: string;
  title_pre?: string;
  title_salutation?: string;
  type?: string;
  ui_settings?: any;
  website: string | null;
}

export interface User {
  available_storage_megabyte?: number;
  color?: string;
  used_storage_megabyte?: number;
  email: string;
  is_active?: boolean;
  is_staff?: boolean;
  last_login?: string | null;
  permissions?: string[];
  pk?: number;
  url?: string;
  username?: string;
  userprofile: UserProfile;
  sub: string | null;
  email_verified: boolean | null;
  name: string | null;
  preferred_username: string | null;
  given_name: string | null;
  family_name: string | null;
  realm_access: any | null;
  groups: any | null;
  admin: boolean | null;
  admin_groups: any | null;
}

export interface UserState {
  user: User | null;
  token: string | null;
  loggedIn: boolean;
}

export interface ExternalUserPayload {
  email: string;
  message: string;
}

