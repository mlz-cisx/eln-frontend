export interface ForgotPassword {
  email: string;
}

export interface ChangePassword {
  password: string;
  token: string;
}

export interface PasswordAPIResponse {
  status?: string;
  email?: string[];
  password?: string[];
  token?: string[];
}
