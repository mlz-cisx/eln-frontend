/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {Injectable} from '@angular/core';
import {Query} from '@datorama/akita';
import {UserStore, UserState} from "@app/services/user/user.store";
import { AuthService } from '../auth/auth.service';

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
