import {Privileges} from "./privileges.interface";

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
  color?: string;
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
  first_name: string | null;
  last_name: string | null;
  realm_access: any | null;
  groups: any | null;
  admin: boolean | null;
  admin_groups: any | null;
  user_groups: any | null;
  oidc_user: boolean | null;
}

export interface UserState {
  user: User | null;
  token: string | null;
  loggedIn: boolean;
}

export interface User_with_privileges {
  user: User,
  privileges: Privileges
}

export interface UserPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmed: string;
}

export interface UserPatchPayload {
  username: string;
  first_name: string;
  last_name: string;
  user_email: string;
}

export interface PasswordPatchPayload {
  password_patch: string;
}
