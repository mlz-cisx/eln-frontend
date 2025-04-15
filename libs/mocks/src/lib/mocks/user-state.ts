import type {UserState} from '@joeseln/types';
import {mockUser} from './user';

export const mockUserState: UserState = {
  user: mockUser,
  token: 'sometoken',
  loggedIn: true,
};
