import {Injectable} from '@angular/core';
import {Store, StoreConfig} from '@datorama/akita';
import type {User} from '@joeseln/types';
import { AuthService } from '../auth/auth.service';

export interface UserState {
  user: User | null;
  bearer: string | null;
  loggedIn: boolean;
}

export function createInitialState(): UserState {
  return {user: null, bearer: null, loggedIn: false};
}

@Injectable({providedIn: 'root'})
@StoreConfig({name: 'user'})
export class UserStore extends Store<UserState> {
  public constructor(
    private _auth: AuthService,
  ) {
    super(createInitialState());

    // Init state per localstorage
    const state = this._auth.getUserDetails();
    if (state) {
      this.update(state);
    }
  }
}
