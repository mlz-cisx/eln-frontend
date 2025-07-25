import {Injectable} from '@angular/core';
import {Query} from '@datorama/akita';
import {UserStore, UserState} from "@app/services/user/user.store";
import { AuthService } from '@app/services';

@Injectable({providedIn: 'root'})
export class UserQuery extends Query<UserState> {
  public user$ = this.select(state => state);

  public constructor(
    protected override store: UserStore,
    private _auth: AuthService,
  ) {
    super(store);
    // update localstorage at value updated
    this.select().subscribe((data) => this._auth.storeUserDetails(data));
  }
}
