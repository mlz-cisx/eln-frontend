/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {UserService} from "@app/services";
import {User} from "@joeseln/types";
import {Router} from "@angular/router";


@UntilDestroy()
@Component({
  selector: 'joeseln-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent implements OnInit {


  public currentUser: User | null = null;


  public constructor(
    private user_service: UserService,
    private _router: Router,
  ) {
  }


  public ngOnInit(): void {
    this.user_service.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      console.log(this.currentUser)
    });
  }


  public go_to_osers() {
    console.log('users')
    this._router.navigate(['/admin/users'])
  }

  public go_to_groups() {
    console.log('groups')
  }

  public go_to_admins() {
    console.log('admins')
  }

}
