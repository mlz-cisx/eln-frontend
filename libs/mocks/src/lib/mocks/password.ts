import type {
  ChangePassword,
  ForgotPassword,
  PasswordAPIResponse
} from '@joeseln/types';

export const mockForgotPasswordPayload: ForgotPassword = {
  email: 'alias@domain.com',
};

export const mockChangePasswordPayload: ChangePassword = {
  token: 'c1fc46d76470231004b4b39b196331261acfdf3560e13',
  password: 'myPa55w0rd!',
};

export const mockPasswordServiceResponse: PasswordAPIResponse = {
  status: 'OK',
};
